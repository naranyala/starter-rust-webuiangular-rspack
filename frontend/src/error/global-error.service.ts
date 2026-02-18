import { Injectable, signal } from '@angular/core';
import { getLogger } from '../logging/logger';
import { appEventBus } from '../event-bus';

export interface RootErrorState {
  id: number;
  title: string;
  message: string;
  source: string;
  timestamp: string;
  details?: string;
}

export interface RootErrorContext {
  source?: string;
  title?: string;
  details?: string;
}

@Injectable({ providedIn: 'root' })
export class GlobalErrorService {
  private readonly logger = getLogger('error.service');
  private sequence = 0;

  readonly activeError = signal<RootErrorState | null>(null);

  report(error: unknown, context: RootErrorContext = {}): RootErrorState {
    const normalized = this.normalizeError(error, context);
    this.activeError.set(normalized);
    appEventBus.publish('error:captured', {
      id: normalized.id,
      source: normalized.source,
      title: normalized.title,
      message: normalized.message,
    });
    this.logger.error('Root error captured', {
      id: normalized.id,
      source: normalized.source,
      title: normalized.title,
      timestamp: normalized.timestamp,
    }, error);
    return normalized;
  }

  dismiss(): void {
    const current = this.activeError();
    if (current) {
      this.logger.info('Root error dismissed', { id: current.id, source: current.source });
    }
    this.activeError.set(null);
  }

  private normalizeError(error: unknown, context: RootErrorContext): RootErrorState {
    const timestamp = new Date().toISOString();
    const source = context.source ?? 'unknown';

    if (error instanceof Error) {
      return {
        id: ++this.sequence,
        title: context.title ?? 'Unexpected Error',
        message: error.message || 'An unexpected error occurred.',
        source,
        timestamp,
        details: context.details ?? error.stack,
      };
    }

    if (typeof error === 'string') {
      return {
        id: ++this.sequence,
        title: context.title ?? 'Unexpected Error',
        message: error,
        source,
        timestamp,
        details: context.details,
      };
    }

    return {
      id: ++this.sequence,
      title: context.title ?? 'Unexpected Error',
      message: 'An unknown runtime error occurred.',
      source,
      timestamp,
      details: context.details,
    };
  }
}
