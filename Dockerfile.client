FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY server ./server
COPY certs ./certs

RUN npm ci
RUN npm run build
RUN npm prune --production

RUN rm -rf server

CMD ["node", "dist/index.js"]
