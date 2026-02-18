export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
type ActiveLogLevel = Exclude<LogLevel, 'silent'>;
type LogContext = Record<string, unknown>;

export interface LoggerOptions {
  enabled: boolean;
  minLevel: LogLevel;
  maxEntries: number;
  redactKeys: string[];
}

export interface LogEntry {
  id: number;
  timestamp: string;
  level: ActiveLogLevel;
  namespace: string;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

type LogSink = (entry: LogEntry) => void;

const DEFAULT_OPTIONS: LoggerOptions = {
  enabled: true,
  minLevel: 'debug',
  maxEntries: 500,
  redactKeys: ['password', 'token', 'secret', 'authorization', 'cookie'],
};

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 99,
};

const MAX_SANITIZE_DEPTH = 4;

class LoggerBackend {
  private options: LoggerOptions = DEFAULT_OPTIONS;
  private sequence = 0;
  private entries: LogEntry[] = [];
  private sinks = new Set<LogSink>([this.consoleSink]);

  configure(partial: Partial<LoggerOptions>): void {
    this.options = {
      ...this.options,
      ...partial,
      redactKeys: partial.redactKeys ?? this.options.redactKeys,
    };
  }

  shouldLog(level: ActiveLogLevel): boolean {
    if (!this.options.enabled) {
      return false;
    }
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.options.minLevel];
  }

  emit(entry: Omit<LogEntry, 'id' | 'timestamp'>): void {
    const fullEntry: LogEntry = {
      ...entry,
      id: ++this.sequence,
      timestamp: new Date().toISOString(),
    };

    this.entries.push(fullEntry);
    if (this.entries.length > this.options.maxEntries) {
      this.entries.shift();
    }

    for (const sink of this.sinks) {
      sink(fullEntry);
    }
  }

  sanitize(value: unknown): unknown {
    return sanitizeValue(value, new Set(this.options.redactKeys.map((k) => k.toLowerCase())));
  }

  snapshot(): LogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }

  addSink(sink: LogSink): void {
    this.sinks.add(sink);
  }

  removeSink(sink: LogSink): void {
    this.sinks.delete(sink);
  }

  private consoleSink(entry: LogEntry): void {
    const method: 'debug' | 'info' | 'warn' | 'error' =
      entry.level === 'debug' ? 'debug' : entry.level === 'info' ? 'info' : entry.level;
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.namespace}]`;
    if (entry.error) {
      console[method](`${prefix} ${entry.message}`, entry.context, entry.error);
      return;
    }
    console[method](`${prefix} ${entry.message}`, entry.context);
  }
}

function sanitizeValue(
  value: unknown,
  redactKeys: Set<string>,
  depth = 0
): unknown {
  if (depth > MAX_SANITIZE_DEPTH) {
    return '[Truncated]';
  }

  if (value == null || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, redactKeys, depth + 1));
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(record)) {
      sanitized[key] = redactKeys.has(key.toLowerCase())
        ? '[REDACTED]'
        : sanitizeValue(raw, redactKeys, depth + 1);
    }
    return sanitized;
  }

  return String(value);
}

class Logger {
  constructor(
    private readonly backend: LoggerBackend,
    private readonly namespace: string,
    private readonly baseContext: LogContext = {}
  ) {}

  child(scope: string, context: LogContext = {}): Logger {
    return new Logger(this.backend, `${this.namespace}.${scope}`, { ...this.baseContext, ...context });
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

const backend = new LoggerBackend();
const rootLogger = new Logger(backend, 'frontend');

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

export function addLogSink(sink: LogSink): void {
  backend.addSink(sink);
}

export function removeLogSink(sink: LogSink): void {
  backend.removeSink(sink);
}

