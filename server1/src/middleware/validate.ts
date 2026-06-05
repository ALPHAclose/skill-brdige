import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

type ValidationSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }

    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }

    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }

    next();
  };
}
