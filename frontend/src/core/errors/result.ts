// src/core/errors/result.ts
// Result type for frontend - inspired by Rust's Result<T, E>

export type Result<T, E = AppError> = 
  | { success: true; value: T }
  | { success: false; error: E };

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: unknown;
  timestamp: number;
}

export enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  BACKEND = 'BACKEND',
  PLUGIN = 'PLUGIN',
  DATABASE = 'DATABASE',
  SERIALIZATION = 'SERIALIZATION',
  PERMISSION = 'PERMISSION',
}

export function ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

export function err<E = AppError>(error: E): Result<never, E> {
  return { success: false, error };
}

export function createError(code: ErrorCode, message: string, details?: unknown): AppError {
  return {
    code,
    message,
    details,
    timestamp: Date.now(),
  };
}

export function isResult<T, E>(value: unknown): value is Result<T, E> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as Record<string, unknown>).success === 'boolean'
  );
}

export function unwrap<T>(result: Result<T>): T {
  if (result.success) {
    return result.value;
  }
  throw new Error(`Unwrap failed: ${result.error.message}`);
}

export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  return result.success ? result.value : defaultValue;
}

export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.success) {
    return { success: true, value: fn(result.value) };
  }
  return result as Result<U, E>;
}

export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (result.success) {
    return result as Result<T, F>;
  }
  return { success: false, error: fn(result.error) };
}

export function andThen<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  if (result.success) {
    return fn(result.value);
  }
  return result as Result<U, E>;
}
