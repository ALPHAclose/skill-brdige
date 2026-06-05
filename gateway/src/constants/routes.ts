import type { Request } from 'express';

type PublicRoute = {
  method: string;
  path: string;
};

const publicRoutes: PublicRoute[] = [
  { method: 'GET', path: '/health' },
  { method: 'POST', path: '/auth/register' },
  { method: 'POST', path: '/auth/login' },
  { method: 'POST', path: '/auth/refresh' }
];

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }

  return path;
}

export function isPublicRoute(req: Request) {
  if (req.method === 'OPTIONS') {
    return true;
  }

  const requestPath = normalizePath(req.path);

  return publicRoutes.some((route) => route.method === req.method && route.path === requestPath);
}
