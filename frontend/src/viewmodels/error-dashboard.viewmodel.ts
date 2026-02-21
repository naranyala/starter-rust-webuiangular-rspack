// src/viewmodels/error-dashboard.viewmodel.ts
// Error Dashboard ViewModel - provides error statistics and history to UI

import { computed, signal } from '@angular/core';
import { errorInterceptor } from '../core/error-interceptor';
import { getLogger } from './logger.viewmodel';

const logger = getLogger('error.dashboard');

export interface BackendErrorEntry {
  id: number;
  timestamp: number;
  severity: 'Info' | 'Warning' | 'Error' | 'Critical';
  source: string;
  code: string;
  message: string;
  details?: string;
  context?: Record<string, string>;
}

export interface ErrorStats {
  total: number;
  errors: number;
  warnings: number;
  critical: number;
}

export interface ErrorDashboardState {
  stats: ErrorStats;
  recentErrors: BackendErrorEntry[];
  frontendStats: ReturnType<typeof errorInterceptor.getStats>;
  isLoading: boolean;
  lastUpdated: number;
}

class ErrorDashboardViewModel {
  private readonly state = signal<ErrorDashboardState>({
    stats: { total: 0, errors: 0, warnings: 0, critical: 0 },
    recentErrors: [],
    frontendStats: {
      total: 0,
      bySource: new Map(),
      byCode: new Map(),
      lastError: null,
      criticalCount: 0,
    },
    isLoading: false,
    lastUpdated: 0,
  });

  readonly stats = computed(() => this.state().stats);
  readonly recentErrors = computed(() => this.state().recentErrors);
  readonly frontendStats = computed(() => this.state().frontendStats);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly lastUpdated = computed(() => this.state().lastUpdated);

  readonly totalErrors = computed(() => {
    const s = this.state();
    return s.stats.total + s.frontendStats.total;
  });

  readonly hasErrors = computed(() => this.totalErrors() > 0);

  constructor() {
    this.setupErrorEventListeners();
  }

  private setupErrorEventListeners(): void {
    // Listen for backend error stats response
    window.addEventListener('error_stats_response', (event: Event) => {
      const customEvent = event as CustomEvent;
      const stats = customEvent.detail as ErrorStats;
      this.updateStats(stats);
    });

    // Listen for recent errors response
    window.addEventListener('recent_errors_response', (event: Event) => {
      const customEvent = event as CustomEvent;
      const { errors } = customEvent.detail as { errors: BackendErrorEntry[] };
      this.updateRecentErrors(errors);
    });

    // Listen for error history cleared
    window.addEventListener('error_history_cleared', () => {
      this.clearLocalState();
    });
  }

  /**
   * Request error statistics from backend
   */
  requestStats(): void {
    logger.info('Requesting error stats from backend');
    // @ts-expect-error - WebUI binding
    if (typeof window.get_error_stats === 'function') {
      // @ts-expect-error
      window.get_error_stats('error_stats');
    }
  }

  /**
   * Request recent errors from backend
   */
  requestRecentErrors(limit = 10): void {
    logger.info(`Requesting recent errors (limit: ${limit})`);
    // @ts-expect-error - WebUI binding
    if (typeof window.get_recent_errors === 'function') {
      // @ts-expect-error
      window.get_recent_errors(`get_recent_errors:${limit}`);
    }
  }

  /**
   * Clear error history on backend
   */
  clearErrorHistory(): void {
    logger.info('Clearing error history');
    // @ts-expect-error - WebUI binding
    if (typeof window.clear_error_history === 'function') {
      // @ts-expect-error
      window.clear_error_history('clear_error_history');
    }
  }

  /**
   * Update stats from backend response
   */
  private updateStats(stats: ErrorStats): void {
    this.state.update(s => ({
      ...s,
      stats,
      lastUpdated: Date.now(),
    }));
    logger.info('Error stats updated', { total: stats.total, errors: stats.errors });
  }

  /**
   * Update recent errors from backend response
   */
  private updateRecentErrors(errors: BackendErrorEntry[]): void {
    this.state.update(s => ({
      ...s,
      recentErrors: errors,
      lastUpdated: Date.now(),
    }));
    logger.info(`Updated ${errors.length} recent errors`);
  }

  /**
   * Refresh frontend stats
   */
  refreshFrontendStats(): void {
    this.state.update(s => ({
      ...s,
      frontendStats: errorInterceptor.getStats(),
    }));
  }

  /**
   * Clear local state
   */
  private clearLocalState(): void {
    this.state.update(s => ({
      ...s,
      stats: { total: 0, errors: 0, warnings: 0, critical: 0 },
      recentErrors: [],
      lastUpdated: Date.now(),
    }));
    logger.info('Error dashboard state cleared');
  }

  /**
   * Print error summary to console
   */
  printSummary(): void {
    errorInterceptor.printSummary();
  }

  /**
   * Get severity color for UI
   */
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'Critical':
        return '#dc3545';
      case 'Error':
        return '#fd7e14';
      case 'Warning':
        return '#ffc107';
      case 'Info':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }
}

// Singleton instance
export const ErrorDashboardVM = new ErrorDashboardViewModel();
