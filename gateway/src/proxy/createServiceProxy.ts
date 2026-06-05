import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Socket } from 'node:net';

import { createProxyMiddleware } from 'http-proxy-middleware';

import { attachTrustedHeaders } from '../utils/headers';

type ServiceProxyOptions = {
  target: string;
  websocket?: boolean;
};

export function createServiceProxy({ target, websocket = false }: ServiceProxyOptions) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: websocket,
    xfwd: true,
    pathRewrite: (path, req) => {
      const originalUrl = (req as IncomingMessage & { originalUrl?: string }).originalUrl;
      return originalUrl ?? path;
    },
    proxyTimeout: 30_000,
    timeout: 30_000,
    on: {
      proxyReq(proxyReq, req) {
        attachTrustedHeaders(proxyReq, req);
      },
      proxyReqWs(proxyReq, req) {
        attachTrustedHeaders(proxyReq, req);
      },
      error(error, _req, res) {
        writeProxyError(error, res);
      }
    }
  });
}

function writeProxyError(error: Error, res: ServerResponse<IncomingMessage> | Socket | undefined) {
  if (!res || !('writeHead' in res) || res.headersSent) {
    return;
  }

  res.writeHead(502, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      success: false,
      error: {
        message: 'Upstream service is unavailable',
        statusCode: 502,
        details: error.message
      }
    })
  );
}
