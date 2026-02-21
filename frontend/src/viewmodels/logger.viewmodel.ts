import type { ActiveLogLevel, LogContext, LogEntry, LoggerOptions } from '../models';
import { LoggingViewModel } from './logging.viewmodel';

export class Logger {
  constructor(
    private readonly backend: LoggingViewModel,
    private readonly namespace: string,
    private readonly baseContext: LogContext = {}
  ) {}

  child(scope: string, context: LogContext = {}): Logger {
    return new Logger(this.backend, `${this.namespace}.${scope}`, {
      ...this.baseContext,
      ...context,
    });
  }

  withContext(context: LogContext): Logger {
    return new Logger(this.backend, this.namespace, { ...this.baseContext, ...context });
  }

  debug(message: string, context: LogContext = {}): void {
    this.log('debug', message, context);
  }

  info(message: string, context: LogContext = {}): void {
    this.log('info', message, context);
  }

  warn(message: string, context: LogContext = {}, error?: unknown): void {
    this.log('warn', message, context, error);
  }

  error(message: string, context: LogContext = {}, error?: unknown): void {
    this.log('error', message, context, error);
  }

  private log(
    level: ActiveLogLevel,
    message: string,
    context: LogContext = {},
    error?: unknown
  ): void {
    if (!this.backend.shouldLog(level)) {
      return;
    }

    const normalizedError = normalizeError(error);
    const safeContext = this.backend.sanitize({ ...this.baseContext, ...context }) as LogContext;

    this.backend.emit({
      level,
      namespace: this.namespace,
      message,
      context: safeContext,
      error: normalizedError,
    });
  }
}

function normalizeError(error: unknown): LogEntry['error'] | undefined {
  if (error == null) {
    return undefined;
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    name: 'UnknownError',
    message: typeof error === 'string' ? error : JSON.stringify(error),
  };
}

function createRootLogger(backend: LoggingViewModel): Logger {
  backend.enableConsoleSink();
  return new Logger(backend, 'frontend');
}

export const backend = new LoggingViewModel();
export const rootLogger = createRootLogger(backend);

export function configureLogging(options: Partial<LoggerOptions>): Logger {
  backend.configure(options);
  return rootLogger;
}

export function getLogger(scope?: string, context: LogContext = {}): Logger {
  if (!scope) {
    return rootLogger.withContext(context);
  }
  return rootLogger.child(scope, context);
}

export function getLogHistory(): LogEntry[] {
  return backend.snapshot();
}

export function clearLogHistory(): void {
  backend.clear();
}
