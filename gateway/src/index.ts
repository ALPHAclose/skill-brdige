import http from 'node:http';
import type { Socket } from 'node:net';

import { createApp } from './app';
import { env } from './config/env';
import { createSocketProxy } from './proxy/socketProxy';
import { authenticateSocketUpgrade } from './utils/socketAuth';

const app = createApp();
const server = http.createServer(app);
const socketProxy = createSocketProxy();

server.on('upgrade', (request, socket, head) => {
  if (!request.url?.startsWith('/socket.io')) {
    socket.destroy();
    return;
  }

  const authenticated = authenticateSocketUpgrade(request, socket);

  if (!authenticated) {
    return;
  }

  socketProxy.upgrade(request, socket as Socket, head);
});

server.listen(env.PORT, () => {
  console.log(`Gateway is running on port ${env.PORT}`);
});
