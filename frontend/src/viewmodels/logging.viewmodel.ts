import { Injectable, signal } from '@angular/core';
import { LogEntry, LogLevel, LogContext, LoggerOptions } from '../models';

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

@Injectable({
  providedIn: 'root'
})
export class LoggingViewModel {
  private options: LoggerOptions = DEFAULT_OPTIONS;
  private sequence = 0;
  private entries: LogEntry[] = [];
  private sinks = new Set<LogSink>();

  configure(partial: Partial<LoggerOptions>): void {
    this.options = {
      ...this.options,
      ...partial,
      redactKeys: partial.redactKeys ?? this.options.redactKeys,
    };
  }

  shouldLog(level: Exclude<LogLevel, 'silent'>): boolean {
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

  enableConsoleSink(): void {
    this.addSink(this.consoleSink.bind(this));
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
