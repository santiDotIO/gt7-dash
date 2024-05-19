import { Socket, createSocket, RemoteInfo } from "node:dgram";
import { AddressInfo, WebSocket } from "ws";

import { gt7parser } from "./parser";
import { decrypt } from "./utils";
import fs from 'fs';
import https from 'https';

// MARK: Setup
const udpSocket: Socket = createSocket("udp4");
const bindPort: number = 33740;
const receivePort: number = 33739;
const psIp: string = process.env.PLAYSTAION_IP;

let isUdpSocketReady = false;

const httpsOptions = {
  key: fs.readFileSync('./certs/server.key'),
  cert: fs.readFileSync('./certs/server.crt')
};


const sendHeartbeat = (s: Socket) => {
  if (!isUdpSocketReady) return;

  s.send(Buffer.from("A"), 0, 1, receivePort, psIp, (err) => {
    if (err) {
      console.log("Heartbeat err!", err);
      s.close();
      return;
    }

    console.log("Heartbeat send!");
  });
  packetCount = 0;
};

let packetCount: number = 0;

const server = https.createServer(httpsOptions, (req, res) => {
  res.writeHead(200);
  res.end('<h1>WebSocket Server (Cloudflare Tunnel)</h1>');
});

// MARK: web socket (communication to dashboard client)
const wsServer = new WebSocket.Server({ 
  server
}); // You can choose any available port

wsServer.on("connection", (ws) => {
  console.log("websocket: connection!");
  sendHeartbeat(udpSocket);
});

// MARK: UDP Socket (communication to PS4/5)
udpSocket.on("error", (err) => {
  console.log(`server error:\n${err.stack}`);
  udpSocket.close();
});

udpSocket.on("message", (data: Buffer, rinfo: RemoteInfo) => {
  if (0x128 === data.length) {
    // console.log(`server got: ${data.length} byt es from ${rinfo.address}:${rinfo.port}`);
    const packet: Buffer = decrypt(data);

    const magic = packet.readInt32LE();
    if (magic != 0x47375330) {
      // 0S7G - G7S0
      console.log("Magic! error!", magic);
    } else {
      const message = gt7parser.parse(packet);

      if (packetCount >= 100) sendHeartbeat(udpSocket);

      packetCount++;
      
      wsServer.clients.forEach((client) => {
        client.send(JSON.stringify(message));
      });
    }
  }
});

udpSocket.on("listening", () => {
  const address = udpSocket.address();
  isUdpSocketReady = true;
  console.log(`server listening ${address.address}:${address.port}`);
});

udpSocket.bind(bindPort);

server.listen(443, () => {
  const address = server.address() as AddressInfo;
  console.log(`Server listening on port ${address.port}`);
});