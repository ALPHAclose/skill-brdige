import morgan from 'morgan';

import { env } from '../config/env';

type LoggedRequest = {
  requestId?: string;
  user?: {
    id: string;
  };
};

morgan.token('request-id', (req) => (req as LoggedRequest).requestId ?? '-');
morgan.token('user-id', (req) => (req as LoggedRequest).user?.id ?? '-');

export const requestLogger = morgan(
  env.LOG_FORMAT === 'dev'
    ? ':method :url :status :response-time ms - :res[content-length] [:request-id]'
    : ':remote-addr :method :url :status :response-time ms :res[content-length] [:request-id] user=:user-id'
);
