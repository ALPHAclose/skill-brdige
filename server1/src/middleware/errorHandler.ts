import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env';
import { HttpError } from '../utils/httpError';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        statusCode: 400,
        requestId: req.requestId,
        details: error.flatten()
      }
    });
    return;
  }

  const isKnownError = error instanceof HttpError;
  const statusCode = isKnownError ? error.statusCode : 500;
  const message = isKnownError ? error.message : 'Internal server error';

  if (!isKnownError) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      requestId: req.requestId,
      ...(env.NODE_ENV !== 'production' && !isKnownError ? { details: String(error) } : {})
    }
  });
};
