interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: Record<string, any>;
  id: number;
}

interface LogLevels {
  DEBUG: number;
  INFO: number;
  WARN: number;
  ERROR: number;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogEntries = 1000;
  private logLevel = 'INFO';
  private logLevels: LogLevels = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  private shouldLog(level: string): boolean {
    return this.logLevels[level as keyof LogLevels] >= this.logLevels[this.logLevel as keyof LogLevels];
  }

  private addLog(level: string, message: string, meta: Record<string, any> = {}): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      meta,
      id: Date.now() + Math.random(),
    };

    this.logs.push(logEntry);

    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    this.outputToConsole(logEntry);
    this.emitLogEvent(logEntry);
  }

  private outputToConsole(entry: LogEntry): void {
    const { level, message, timestamp } = entry;
    const formattedMessage = `[${timestamp}] ${level} - ${message}`;

    switch (level) {
      case 'ERROR':
        console.error(formattedMessage);
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      case 'INFO':
        console.info(formattedMessage);
        break;
      case 'DEBUG':
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  private emitLogEvent(entry: LogEntry): void {
    const event = new CustomEvent('logEntryAdded', { detail: entry });
    window.dispatchEvent(event);
  }

  debug(message: string, meta: Record<string, any> = {}): void {
    this.addLog('DEBUG', message, meta);
  }

  info(message: string, meta: Record<string, any> = {}): void {
    this.addLog('INFO', message, meta);
  }

  warn(message: string, meta: Record<string, any> = {}): void {
    this.addLog('WARN', message, meta);
  }

  error(message: string, meta: Record<string, any> = {}): void {
    this.addLog('ERROR', message, meta);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    window.dispatchEvent(new CustomEvent('logsCleared'));
  }

  setLogLevel(level: string): void {
    const upperLevel = level.toUpperCase();
    if (Object.prototype.hasOwnProperty.call(this.logLevels, upperLevel)) {
      this.logLevel = upperLevel;
      this.info(`Log level set to ${this.logLevel}`);
    } else {
      console.warn(`Invalid log level: ${level}. Valid levels: DEBUG, INFO, WARN, ERROR`);
    }
  }

  getLogLevel(): string {
    return this.logLevel;
  }
}

const logger = new Logger();

(window as any).Logger = logger;

export { Logger };
export default logger;