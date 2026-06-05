import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';

import { applyTrustedHeadersToIncomingRequest, stripIdentityHeadersFromIncomingRequest } from './headers';
import { verifyAccessTokenFromRequest } from './jwt';

export function authenticateSocketUpgrade(req: IncomingMessage, socket: Duplex) {
  stripIdentityHeadersFromIncomingRequest(req);

  try {
    const user = verifyAccessTokenFromRequest(req);
    applyTrustedHeadersToIncomingRequest(req, user);
    return true;
  } catch {
    socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return false;
  }
}
