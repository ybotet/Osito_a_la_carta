type ErrorCode = string;

class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    Error.captureStackTrace?.(this, AppError);
  }
}

class NotFoundError extends AppError {
  constructor(message: string, code: ErrorCode, details?: unknown) {
    super(message, 404, code, details);
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string, code: ErrorCode, details?: unknown) {
    super(message, 401, code, details);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message: string, code: ErrorCode, details?: unknown) {
    super(message, 403, code, details);
    this.name = 'ForbiddenError';
  }
}

class BadRequestError extends AppError {
  constructor(message: string, code: ErrorCode, details?: unknown) {
    super(message, 400, code, details);
    this.name = 'BadRequestError';
  }
}

class ConflictError extends AppError {
  constructor(message: string, code: ErrorCode, details?: unknown) {
    super(message, 409, code, details);
    this.name = 'ConflictError';
  }
}

export {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
};

export type { ErrorCode };
