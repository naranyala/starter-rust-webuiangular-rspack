// core/frontend/src/error/handler.ts
/**
 * Error Handler - Centralized Error Processing
 * 
 * Provides centralized error handling, logging, and UI display.
 */

import { AppError } from './errors';
import { Result } from './result';

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  /** Show error details in console */
  verbose: boolean;
  /** Show user-friendly messages */
  userFriendly: boolean;
  /** Log errors to backend */
  logToBackend: boolean;
  /** Custom error handlers */
  handlers?: Record<string, (error: AppError) => void>;
}

/**
 * Error response for UI
 */
export interface ErrorDisplay {
  code: string;
  message: string;
  userMessage: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  details?: Record<string, any>;
}

/**
 * Centralized error handler
 */
export class ErrorHandler {
  private config: ErrorHandlerConfig;
  
  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      verbose: import.meta.env.DEV,
      userFriendly: true,
      logToBackend: false,
      ...config,
    };
  }
  
  /**
   * Handle an error and return display info
   */
  handle(error: unknown): ErrorDisplay {
    // Convert to AppError if needed
    const appError = error instanceof AppError ? error : this.wrapError(error);
    
    // Log the error
    this.logError(appError);
    
    // Call custom handler if registered
    if (this.config.handlers?.[appError.code]) {
      this.config.handlers[appError.code](appError);
    }
    
    // Create display info
    return this.toDisplay(appError);
  }
  
  /**
   * Handle a Result and show error if failed
   */
  handleResult<T>(result: Result<T>, options?: {
    onSuccess?: (value: T) => void;
    onError?: (display: ErrorDisplay) => void;
  }): T | null {
    if (result.isErr) {
      const display = this.handle(result.error);
      options?.onError?.(display);
      return null;
    }
    
    options?.onSuccess?.(result.value);
    return result.value;
  }
  
  /**
   * Handle async Result
   */
  async handleResultAsync<T>(
    result: Promise<Result<T>>,
    options?: {
      onSuccess?: (value: T) => void;
      onError?: (display: ErrorDisplay) => void;
    }
  ): Promise<T | null> {
    const resolved = await result;
    return this.handleResult(resolved, options);
  }
  
  /**
   * Wrap unknown error as AppError
   */
  private wrapError(error: unknown): AppError {
    if (error instanceof Error) {
      return new (class extends AppError {
        readonly name = 'UnknownError';
        readonly code = 'UNKNOWN';
        constructor(error: Error) {
          super(error.message, error);
        }
      })(error);
    }
    
    return new (class extends AppError {
      readonly name = 'UnknownError';
      readonly code = 'UNKNOWN';
      constructor(message: string) {
        super(message);
      }
    })(String(error));
  }
  
  /**
   * Log error to appropriate channel
   */
  private logError(error: AppError): void {
    if (!this.config.verbose) return;
    
    const logMethod = this.getLogLevel(error.code);
    
    console[logMethod](`[Error] ${error.code}: ${error.message}`);
    
    if (Object.keys(error.context).length > 0) {
      console[logMethod]('Context:', error.context);
    }
    
    if (error.cause) {
      console[logMethod]('Cause:', error.cause);
    }
  }
  
  /**
   * Get log level based on error code
   */
  private getLogLevel(code: string): 'log' | 'warn' | 'error' {
    const warnCodes = ['NOT_FOUND', 'VALIDATION_ERROR', 'TIMEOUT'];
    if (warnCodes.includes(code)) return 'warn';
    return 'error';
  }
  
  /**
   * Convert error to display info
   */
  private toDisplay(error: AppError): ErrorDisplay {
    return {
      code: error.code,
      message: error.message,
      userMessage: this.getUserMessage(error),
      severity: this.getSeverity(error.code),
      details: this.config.verbose ? error.toJSON() : undefined,
    };
  }
  
  /**
   * Get user-friendly message
   */
  private getUserMessage(error: AppError): string {
    if (!this.config.userFriendly) {
      return error.message;
    }
    
    // Map error codes to user-friendly messages
    const userMessages: Record<string, string> = {
      'NOT_FOUND': 'The requested item was not found',
      'VALIDATION_ERROR': 'Please check your input and try again',
      'TIMEOUT': 'The operation took too long. Please try again',
      'NETWORK_ERROR': 'Unable to connect. Please check your connection',
      'DATABASE_ERROR': 'A database error occurred. Please try again',
      'INTERNAL_ERROR': 'An unexpected error occurred. Please contact support',
    };
    
    return userMessages[error.code] || error.message;
  }
  
  /**
   * Get severity level
   */
  private getSeverity(code: string): ErrorDisplay['severity'] {
    const criticalCodes = ['INTERNAL_ERROR', 'DATABASE_ERROR'];
    const errorCodes = ['NETWORK_ERROR', 'PLUGIN_LOAD_FAILED'];
    const warningCodes = ['NOT_FOUND', 'VALIDATION_ERROR', 'TIMEOUT'];
    
    if (criticalCodes.includes(code)) return 'critical';
    if (errorCodes.includes(code)) return 'error';
    if (warningCodes.includes(code)) return 'warning';
    return 'info';
  }
  
  /**
   * Register custom error handler
   */
  on(code: string, handler: (error: AppError) => void): void {
    if (!this.config.handlers) {
      this.config.handlers = {};
    }
    this.config.handlers[code] = handler;
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new ErrorHandler();

/**
 * Handle uncaught errors
 */
export function setupGlobalErrorHandling(): void {
  // Uncaught exceptions
  window.addEventListener('error', (event) => {
    event.preventDefault();
    globalErrorHandler.handle(event.error);
  });
  
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    globalErrorHandler.handle(event.reason);
  });
}
