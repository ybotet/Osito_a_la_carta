import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../logger.js';
import { AppError } from './errors.js';

type ErrorBody = {
  error: string;
  code: string;
  details?: unknown;
};

const notFoundHandler: RequestHandler = (_req, res) => {
  const body: ErrorBody = { error: 'Not found', code: 'NOT_FOUND' };

  res.status(404).json(body);
};

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (res.headersSent) {
    return;
  }

  if (error instanceof AppError) {
    const body: ErrorBody = { error: error.message, code: error.code };

    if (error.details !== undefined) {
      body.details = error.details;
    }

    logger.warn(
      { code: error.code, status: error.statusCode, path: req.path },
      body.error,
    );

    res.status(error.statusCode).json(body);

    return;
  }

  if (error instanceof ZodError) {
    logger.warn({ path: req.path, issues: error.issues }, 'Validation error');

    res.status(400).json({
      error: 'Invalid request',
      code: 'VALIDATION_ERROR',
      details: error.issues,
    } satisfies ErrorBody);

    return;
  }

  logger.error({ err: error, path: req.path }, 'Unhandled error');

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  } satisfies ErrorBody);
};

export { errorHandler, notFoundHandler };
