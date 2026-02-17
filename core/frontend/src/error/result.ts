// core/frontend/src/error/result.ts
/**
 * Result Type - Functional Error Handling
 * 
 * Represents a value that can be either success (Ok) or failure (Err).
 * This makes error handling explicit and composable.
 */

/**
 * Success case - contains the successful value
 */
export class Ok<T, E extends Error = Error> {
  readonly isSuccess = true;
  readonly isErr = false;
  
  constructor(readonly value: T) {}
  
  /**
   * Map the success value
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    return Result.ok(fn(this.value));
  }
  
  /**
   * Flat map the success value (chain operations)
   */
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }
  
  /**
   * Get the value or a default
   */
  unwrapOr(defaultValue: T): T {
    return this.value;
  }
  
  /**
   * Get the value or throw error
   */
  unwrap(): T {
    return this.value;
  }
  
  /**
   * Convert to option (Some if Ok, None if Err)
   */
  toOption(): Option<T> {
    return { type: 'some', value: this.value };
  }
}

/**
 * Error case - contains the error
 */
export class Err<T, E extends Error = Error> {
  readonly isSuccess = false;
  readonly isErr = true;
  
  constructor(readonly error: E) {}
  
  /**
   * Map the error value
   */
  mapError<F extends Error>(fn: (error: E) => F): Result<T, F> {
    return Result.err(fn(this.error));
  }
  
  /**
   * Get the value or a default
   */
  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }
  
  /**
   * Get the value or throw error
   */
  unwrap(): T {
    throw this.error;
  }
  
  /**
   * Convert to option (always None)
   */
  toOption(): Option<T> {
    return { type: 'none' };
  }
}

/**
 * Result type - union of Ok and Err
 */
export type Result<T, E extends Error = Error> = Ok<T, E> | Err<T, E>;

/**
 * Option type - represents optional values
 */
export type Option<T> = { type: 'some'; value: T } | { type: 'none' };

/**
 * Result utility functions
 */
export const Result = {
  /**
   * Create a success result
   */
  ok: <T, E extends Error = Error>(value: T): Result<T, E> => {
    return new Ok(value);
  },
  
  /**
   * Create an error result
   */
  err: <T, E extends Error = Error>(error: E): Result<T, E> => {
    return new Err(error);
  },
  
  /**
   * Execute a function and catch errors
   */
  try<T>(fn: () => T): Result<T, Error> {
    try {
      return Result.ok(fn());
    } catch (error) {
      return Result.err(error as Error);
    }
  },
  
  /**
   * Execute an async function and catch errors
   */
  async tryAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
    try {
      return Result.ok(await fn());
    } catch (error) {
      return Result.err(error as Error);
    }
  },
  
  /**
   * Combine multiple results - returns first error or all values
   */
  all<T extends any[]>(
    results: { [K in keyof T]: Result<T[K]> }
  ): Result<{ [K in keyof T]: T[K] }> {
    for (const result of results) {
      if (result.isErr) {
        return result as Err<any>;
      }
    }
    return Result.ok(results.map(r => (r as Ok<any>).value) as any);
  },
  
  /**
   * Convert option to result
   */
  fromOption<T, E extends Error>(
    option: Option<T>,
    error: E
  ): Result<T, E> {
    return option.type === 'some'
      ? Result.ok(option.value)
      : Result.err(error);
  },
  
  /**
   * Convert nullable to result
   */
  fromNullable<T, E extends Error>(
    value: T | null | undefined,
    error: E
  ): Result<T, E> {
    return value != null
      ? Result.ok(value)
      : Result.err(error);
  },
};

/**
 * Match on result (pattern matching)
 */
export function match<T, E extends Error, R>(
  result: Result<T, E>,
  cases: {
    ok: (value: T) => R;
    err: (error: E) => R;
  }
): R {
  return result.isErr
    ? cases.err(result.error)
    : cases.ok(result.value);
}

/**
 * Pipe results through transformations
 */
export function pipe<T, E extends Error>(
  result: Result<T, E>
): {
  map: <U>(fn: (value: T) => U) => Result<U, E>;
  andThen: <U>(fn: (value: T) => Result<U, E>) => Result<U, E>;
  mapError: <F extends Error>(fn: (error: E) => F) => Result<T, F>;
  unwrapOr: (defaultValue: T) => T;
  match: <R>(cases: { ok: (value: T) => R; err: (error: E) => R }) => R;
} {
  return {
    map: (fn) => result.map(fn),
    andThen: (fn) => result.andThen(fn),
    mapError: (fn) => (result.isErr ? Result.err(fn(result.error)) : result),
    unwrapOr: (defaultValue) => (result.isErr ? defaultValue : result.value),
    match: (cases) => match(result, cases),
  };
}

// Type guards
export function isOk<T, E extends Error>(result: Result<T, E>): result is Ok<T, E> {
  return result.isSuccess;
}

export function isErr<T, E extends Error>(result: Result<T, E>): result is Err<T, E> {
  return result.isErr;
}
