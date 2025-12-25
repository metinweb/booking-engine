// Base Error
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

// 400 Bad Request
export class BadRequestError extends AppError {
  constructor(message = 'BAD_REQUEST') {
    super(message, 400)
  }
}

// 401 Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message = 'UNAUTHORIZED') {
    super(message, 401)
  }
}

// 403 Forbidden
export class ForbiddenError extends AppError {
  constructor(message = 'FORBIDDEN') {
    super(message, 403)
  }
}

// 404 Not Found
export class NotFoundError extends AppError {
  constructor(message = 'NOT_FOUND') {
    super(message, 404)
  }
}

// 409 Conflict
export class ConflictError extends AppError {
  constructor(message = 'CONFLICT') {
    super(message, 409)
  }
}

// 422 Validation Error
export class ValidationError extends AppError {
  constructor(message = 'VALIDATION_ERROR') {
    super(message, 422)
  }
}
