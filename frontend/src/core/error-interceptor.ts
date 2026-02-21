// src/core/error-interceptor.ts
// Error interceptor for WebUI calls - catches all backend communication errors

import { ErrorCode, type ErrorValue } from '../types';
import { getLogger } from '../viewmodels/logger.viewmodel';
import { GlobalErrorService } from './global-error.service';

const logger = getLogger('error.interceptor');

/**
 * Error context for tracking
 */
export interface ErrorContext {
  source: 'webui' | 'http' | 'promise' | 'sync';
  operation: string;
  payload?: unknown;
  timestamp: number;
}

/**
 * Error statistics for dashboard
 */
export interface ErrorStats {
  total: number;
  bySource: Map<string, number>;
  byCode: Map<string, number>;
  lastError: ErrorContext | null;
  criticalCount: number;
}

class ErrorInterceptor {
  private readonly errorService: GlobalErrorService;
  private stats: ErrorStats;
  private errorHistory: Array<{ error: ErrorValue; context: ErrorContext }>;
  private readonly maxHistory = 50;

  constructor() {
    this.errorService = new GlobalErrorService();
    this.stats = {
      total: 0,
      bySource: new Map(),
      byCode: new Map(),
      lastError: null,
      criticalCount: 0,
    };
    this.errorHistory = [];
  }

  /**
   * Intercept WebUI call errors
   */
  interceptWebUICall<T>(
    operation: string,
    fn: () => T,
    options?: { silent?: boolean; defaultError?: ErrorCode }
  ): T | null {
    const context: ErrorContext = {
      source: 'webui',
      operation,
      timestamp: Date.now(),
    };

    try {
      return fn();
    } catch (error) {
      this.handleError(error, context, options);
      return null;
    }
  }

  /**
   * Intercept async WebUI call errors
   */
  async interceptWebUIAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: { silent?: boolean; defaultError?: ErrorCode }
  ): Promise<T | null> {
    const context: ErrorContext = {
      source: 'webui',
      operation,
      timestamp: Date.now(),
    };

    try {
      return await fn();
    } catch (error) {
      this.handleError(error, context, options);
      return null;
    }
  }

  /**
   * Intercept HTTP call errors
   */
  async interceptHttp<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: { silent?: boolean; defaultError?: ErrorCode }
  ): Promise<T | null> {
    const context: ErrorContext = {
      source: 'http',
      operation,
      timestamp: Date.now(),
    };

    try {
      return await fn();
    } catch (error) {
      this.handleError(error, context, options);
      return null;
    }
  }

  /**
   * Handle error with consistent logic
   */
  handleError(
    error: unknown,
    context: ErrorContext,
    options?: { silent?: boolean; defaultError?: ErrorCode }
  ): void {
    // Update statistics
    this.stats.total++;
    this.stats.lastError = context;

    const sourceCount = this.stats.bySource.get(context.source) || 0;
    this.stats.bySource.set(context.source, sourceCount + 1);

    // Convert to ErrorValue
    const errorValue = this.convertToErrorValue(error, options?.defaultError);

    // Update code statistics
    const codeStr = errorValue.code.toString();
    const codeCount = this.stats.byCode.get(codeStr) || 0;
    this.stats.byCode.set(codeStr, codeCount + 1);

    // Track critical errors
    if (this.isCriticalError(errorValue.code)) {
      this.stats.criticalCount++;
    }

    // Store in history
    this.errorHistory.push({ error: errorValue, context });
    if (this.errorHistory.length > this.maxHistory) {
      this.errorHistory.shift();
    }

    // Log to console with rich context
    if (!options?.silent) {
      this.logErrorToConsole(errorValue, context);
    }

    // Report to global error service
    this.errorService.report(errorValue, {
      source: context.source,
      title: `Error in ${context.operation}`,
    });
  }

  /**
   * Convert unknown error to structured ErrorValue
   */
  private convertToErrorValue(error: unknown, defaultCode?: ErrorCode): ErrorValue {
    if (error && typeof error === 'object' && 'code' in error) {
      return error as ErrorValue;
    }

    if (error instanceof Error) {
      return {
        code: defaultCode || ErrorCode.InternalError,
        message: error.message,
        details: error.stack,
      };
    }

    if (typeof error === 'string') {
      return {
        code: defaultCode || ErrorCode.InternalError,
        message: error,
      };
    }

    return {
      code: defaultCode || ErrorCode.Unknown,
      message: 'An unknown error occurred',
      details: typeof error === 'object' ? JSON.stringify(error) : String(error),
    };
  }

  /**
   * Log error to console with colors and formatting
   */
  private logErrorToConsole(error: ErrorValue, context: ErrorContext): void {
    const timestamp = new Date(context.timestamp).toISOString();
    const severity = this.isCriticalError(error.code) ? 'CRITICAL' : 'ERROR';
    const severityColor = this.isCriticalError(error.code) ? '\x1b[35m' : '\x1b[31m';
    const reset = '\x1b[0m';
    const bold = '\x1b[1m';

    // Console group for structured output
    console.groupCollapsed(
      `${severityColor}${bold}[${severity}]${reset} ${timestamp} - ${context.operation}`
    );

    console.log(`${bold}Source:${reset} ${context.source}`);
    console.log(`${bold}Code:${reset} ${error.code}`);
    console.log(`${bold}Message:${reset} ${error.message}`);

    if (error.details) {
      console.log(`${bold}Details:${reset}`, error.details);
    }

    if (error.field) {
      console.log(`${bold}Field:${reset} ${error.field}`);
    }

    if (error.context) {
      console.log(`${bold}Context:${reset}`, error.context);
    }

    // Print stack trace if available
    if (error.details && typeof error.details === 'string' && error.details.includes('at ')) {
      console.log(`${bold}Stack Trace:${reset}`);
      console.log(error.details);
    }

    console.groupEnd();
  }

  /**
   * Check if error code is critical
   */
  private isCriticalError(code: ErrorCode): boolean {
    return [
      ErrorCode.InternalError,
      ErrorCode.DbConnectionFailed,
      ErrorCode.DbQueryFailed,
      ErrorCode.SerializationFailed,
      ErrorCode.DeserializationFailed,
    ].includes(code);
  }

  /**
   * Get error statistics
   */
  getStats(): ErrorStats {
    return { ...this.stats };
  }

  /**
   * Get recent error history
   */
  getHistory(limit = 10): Array<{ error: ErrorValue; context: ErrorContext }> {
    return this.errorHistory.slice(-limit);
  }

  /**
   * Clear error history and stats
   */
  clear(): void {
    this.stats = {
      total: 0,
      bySource: new Map(),
      byCode: new Map(),
      lastError: null,
      criticalCount: 0,
    };
    this.errorHistory = [];
    logger.info('Error interceptor cleared');
  }

  /**
   * Print error summary to console
   */
  printSummary(): void {
    const reset = '\x1b[0m';
    const bold = '\x1b[1m';
    const cyan = '\x1b[36m';
    const yellow = '\x1b[33m';
    const red = '\x1b[31m';

    console.log(`\n${'='.repeat(60)}`);
    console.log(`${bold}${cyan}  ERROR SUMMARY${reset}`);
    console.log('='.repeat(60));
    console.log(`${bold}  Total Errors:${reset}   ${this.stats.total}`);
    console.log(`${bold}  Critical:${reset}       ${red}${this.stats.criticalCount}${reset}`);
    console.log(
      `${bold}  Warnings:${reset}       ${yellow}${this.stats.total - this.stats.criticalCount}${reset}`
    );
    console.log('-'.repeat(60));

    console.log(`${bold}  By Source:${reset}`);
    this.stats.bySource.forEach((count, source) => {
      console.log(`    - ${source}: ${count}`);
    });

    console.log(`${bold}  By Code:${reset}`);
    this.stats.byCode.forEach((count, code) => {
      console.log(`    - ${code}: ${count}`);
    });

    console.log(`${'='.repeat(60)}\n`);
  }
}

// Singleton instance
export const errorInterceptor = new ErrorInterceptor();

// Export hook for global error handler
export function setupGlobalErrorInterception(): void {
  // Intercept unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    event.preventDefault();
    errorInterceptor.handleError(event.reason, {
      source: 'promise',
      operation: 'Unhandled Promise Rejection',
      timestamp: Date.now(),
    });
  });

  // Intercept global errors (already handled by GlobalErrorHandler)
  // This is a backup layer
  window.addEventListener('error', event => {
    event.preventDefault();
    errorInterceptor.handleError(event.error || event.message, {
      source: 'sync',
      operation: 'Global Error',
      timestamp: Date.now(),
    });
  });

  logger.info('Global error interception enabled');
}
