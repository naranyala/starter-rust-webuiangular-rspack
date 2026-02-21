import { Injectable, signal } from '@angular/core';
import { getLogger } from '../viewmodels/logger';
import { EventBusViewModel } from '../viewmodels/event-bus.viewmodel';
import {
  ErrorValue,
  ErrorCode,
  Result,
  ok,
  err,
  isOk,
  isErr,
  toUserMessage,
  logError,
} from '../types/error.types';

export interface RootErrorState {
  id: number;
  error: ErrorValue;
  title: string;
  userMessage: string;
  timestamp: string;
  source: string;
}

export interface RootErrorContext {
  source?: string;
  title?: string;
}

/**
 * Global error service implementing "errors as values" pattern
 * 
 * Usage:
 * 1. Report errors as values: errorService.report(err)
 * 2. Handle Results: errorService.handleResult(result, 'Operation failed')
 * 3. Convert exceptions: errorService.fromException(ex)
 */
@Injectable({ providedIn: 'root' })
export class GlobalErrorService {
  private readonly logger = getLogger('error.service');
  private sequence = 0;
  private eventBus: EventBusViewModel<Record<string, unknown>>;

  readonly activeError = signal<RootErrorState | null>(null);

  constructor() {
    const debugWindow = window as unknown as { __FRONTEND_EVENT_BUS__?: EventBusViewModel<Record<string, unknown>> };
    this.eventBus = debugWindow.__FRONTEND_EVENT_BUS__ ?? new EventBusViewModel<Record<string, unknown>>();
  }

  /**
   * Report a structured error value
   */
  report(error: ErrorValue, context: RootErrorContext = {}): RootErrorState {
    const state = this.createErrorState(error, context);
    this.activeError.set(state);
    this.publishErrorEvent(state);
    this.logError(state, error);
    return state;
  }

  /**
   * Handle a Result type - report error if failed, return value if successful
   */
  handleResult<T>(result: Result<T>, context: RootErrorContext = {}): T | null {
    if (isOk(result)) {
      return result.value;
    }
    this.report(result.error, context);
    return null;
  }

  /**
   * Handle a Result type with a custom error handler
   * Returns a new Result with potentially transformed error
   */
  handleResultWith<T, E>(
    result: Result<T, E>,
    onError: (error: E) => ErrorValue,
    context: RootErrorContext = {}
  ): Result<T> {
    if (isOk(result)) {
      return ok(result.value);
    }
    const errorValue = onError(result.error);
    this.report(errorValue, context);
    return err(errorValue);
  }

  /**
   * Convert an exception to a structured error value
   */
  fromException(exception: unknown, defaultCode: ErrorCode = ErrorCode.Unknown): ErrorValue {
    if (exception instanceof Error) {
      return {
        code: defaultCode,
        message: exception.message,
        details: exception.stack,
      };
    }
    if (typeof exception === 'string') {
      return {
        code: defaultCode,
        message: exception,
      };
    }
    return {
      code: defaultCode,
      message: 'An unknown error occurred',
      details: JSON.stringify(exception),
    };
  }

  /**
   * Create a validation error for form fields
   */
  validationError(field: string, message: string, context: RootErrorContext = {}): RootErrorState {
    const error: ErrorValue = {
      code: ErrorCode.ValidationFailed,
      message,
      field,
    };
    return this.report(error, context);
  }

  /**
   * Create a not found error
   */
  notFoundError(resource: string, id: string | number, context: RootErrorContext = {}): RootErrorState {
    const error: ErrorValue = {
      code: ErrorCode.ResourceNotFound,
      message: `${resource} not found: ${id}`,
      context: { resource, id: String(id) },
    };
    return this.report(error, context);
  }

  /**
   * Dismiss the current error
   */
  dismiss(): void {
    const current = this.activeError();
    if (current) {
      this.logger.info('Root error dismissed', { id: current.id, source: current.source });
    }
    this.activeError.set(null);
  }

  /**
   * Check if there's an active error
   */
  hasError(): boolean {
    return this.activeError() !== null;
  }

  /**
   * Get the current error code if present
   */
  getCurrentErrorCode(): ErrorCode | null {
    const error = this.activeError();
    return error?.error.code ?? null;
  }

  /**
   * Check if the current error matches a specific code
   */
  isErrorCode(code: ErrorCode): boolean {
    return this.getCurrentErrorCode() === code;
  }

  private createErrorState(error: ErrorValue, context: RootErrorContext): RootErrorState {
    const timestamp = new Date().toISOString();
    const source = context.source ?? 'unknown';
    const title = context.title ?? this.getDefaultTitle(error.code);
    const userMessage = toUserMessage(error);

    return {
      id: ++this.sequence,
      error,
      title,
      userMessage,
      source,
      timestamp,
    };
  }

  private getDefaultTitle(code: ErrorCode): string {
    switch (code) {
      case ErrorCode.ValidationFailed:
        return 'Validation Error';
      case ErrorCode.ResourceNotFound:
      case ErrorCode.UserNotFound:
      case ErrorCode.EntityNotFound:
        return 'Not Found';
      case ErrorCode.DbAlreadyExists:
        return 'Already Exists';
      case ErrorCode.InternalError:
      case ErrorCode.LockPoisoned:
        return 'System Error';
      default:
        return 'Error';
    }
  }

  private publishErrorEvent(state: RootErrorState): void {
    this.eventBus.publish('error:captured', {
      id: state.id,
      source: state.source,
      title: state.title,
      code: state.error.code,
      message: state.error.message,
      field: state.error.field,
    });
  }

  private logError(state: RootErrorState, error: ErrorValue): void {
    this.logger.error('Root error captured', {
      id: state.id,
      source: state.source,
      title: state.title,
      timestamp: state.timestamp,
      code: error.code,
    }, error);
  }
}
