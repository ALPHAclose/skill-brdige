import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';

import type { RequestHandler } from 'express';

import { env } from '../config/env';
import { createServiceProxy } from './createServiceProxy';

type SocketProxy = RequestHandler & {
  upgrade: (req: IncomingMessage, socket: Socket, head: Buffer) => void;
};

export function createSocketProxy() {
  return createServiceProxy({
    target: env.SERVER1_URL,
    websocket: true
  }) as unknown as SocketProxy;
}
