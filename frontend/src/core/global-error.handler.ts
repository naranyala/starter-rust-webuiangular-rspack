import { type ErrorHandler, Injector, inject } from '@angular/core';
import { ErrorCode, type ErrorValue } from '../types';
import { GlobalErrorService } from './global-error.service';

export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  handleError(error: unknown): void {
    const errorService = this.injector.get(GlobalErrorService);

    // Convert unknown error to ErrorValue with rich context
    const errorValue: ErrorValue = this.extractErrorValue(error);

    errorService.report(errorValue, {
      source: 'angular',
      title: this.extractTitle(error),
    });
  }

  /**
   * Extract structured error value from any error type
   */
  private extractErrorValue(error: unknown): ErrorValue {
    if (error instanceof Error) {
      // Check for specific error types
      if (error.name === 'HttpErrorResponse') {
        const httpError = error as any;
        return {
          code: this.mapHttpCodeToErrorCode(httpError.status),
          message: httpError.message || 'Network request failed',
          details: httpError.error?.details || httpError.stack,
          context: {
            status: String(httpError.status),
            url: httpError.url || 'unknown',
          },
        };
      }

      return {
        code: ErrorCode.InternalError,
        message: error.message,
        details: error.stack,
      };
    }

    if (typeof error === 'string') {
      return {
        code: this.inferErrorCode(error),
        message: error,
      };
    }

    if (error && typeof error === 'object') {
      const obj = error as Record<string, unknown>;

      // Check if it's an API error response
      if (obj.error && typeof obj.error === 'object') {
        const errorObj = obj.error as Record<string, unknown>;
        return {
          code: (errorObj.code as ErrorCode) || ErrorCode.Unknown,
          message: (errorObj.message as string) || 'An error occurred',
          details: errorObj.details as string,
          field: errorObj.field as string,
          cause: errorObj.cause as string,
          context: errorObj.context as Record<string, string>,
        };
      }

      // Check if it has message property
      if (typeof obj.message === 'string') {
        return {
          code: this.inferErrorCode(obj.message),
          message: obj.message,
          details: (obj.stack as string) || JSON.stringify(error, null, 2),
        };
      }
    }

    return {
      code: ErrorCode.Unknown,
      message: 'An unknown error occurred',
      details: typeof error === 'object' ? JSON.stringify(error) : String(error),
    };
  }

  /**
   * Infer error code from message content
   */
  private inferErrorCode(message: string): ErrorCode {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('network') || lowerMsg.includes('fetch') || lowerMsg.includes('http')) {
      return ErrorCode.DbConnectionFailed;
    }
    if (lowerMsg.includes('not found') || lowerMsg.includes('404')) {
      return ErrorCode.ResourceNotFound;
    }
    if (lowerMsg.includes('validation') || lowerMsg.includes('invalid')) {
      return ErrorCode.ValidationFailed;
    }
    if (lowerMsg.includes('duplicate') || lowerMsg.includes('already exists')) {
      return ErrorCode.DbAlreadyExists;
    }
    if (
      lowerMsg.includes('permission') ||
      lowerMsg.includes('unauthorized') ||
      lowerMsg.includes('forbidden')
    ) {
      return ErrorCode.InternalError;
    }
    if (lowerMsg.includes('timeout')) {
      return ErrorCode.InternalError;
    }

    return ErrorCode.Unknown;
  }

  /**
   * Map HTTP status code to error code
   */
  private mapHttpCodeToErrorCode(status: number): ErrorCode {
    switch (status) {
      case 400:
        return ErrorCode.ValidationFailed;
      case 401:
      case 403:
        return ErrorCode.InternalError;
      case 404:
        return ErrorCode.ResourceNotFound;
      case 409:
        return ErrorCode.DbAlreadyExists;
      case 500:
      case 502:
      case 503:
        return ErrorCode.InternalError;
      default:
        return ErrorCode.Unknown;
    }
  }

  /**
   * Extract a user-friendly title from error
   */
  private extractTitle(error: unknown): string {
    if (error instanceof Error) {
      if (error.name === 'HttpErrorResponse') {
        const httpError = error as any;
        const status = httpError.status;
        if (status >= 500) return 'Server Error';
        if (status >= 400) return 'Request Failed';
      }
      return 'Error';
    }
    return 'Error';
  }
}
