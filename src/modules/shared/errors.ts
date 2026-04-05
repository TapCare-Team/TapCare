export class DomainError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Not found", code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class ConflictError extends DomainError {
  constructor(message = "Conflict", code = "CONFLICT") {
    super(message, 409, code);
  }
}

export class ConfigurationError extends DomainError {
  constructor(message = "Configuration error", code = "CONFIGURATION_ERROR") {
    super(message, 500, code);
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
