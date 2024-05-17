const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000; // Use environment variable or default port 3000

http.createServer((req, res) => {
  const url = req.url === '/' ? 'index.html' : req.url; // Default to index.html for root URL
  const filePath = path.join(__dirname, url); // Construct file path from requested URL

  // Check for requested file extension
  const extname = url.split('.').pop();

  // Set appropriate content type based on extension
  let contentType = 'text/html';
  switch (extname) {
    case 'css':
      contentType = 'text/css';
      break;
    case 'js':
      contentType = 'text/javascript';
      break;
  }
  console.log('__dirname:', );

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Handle errors, like file not found
      console.error(err);
      res.statusCode = 404;
      res.end('File not found!');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
})
.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
