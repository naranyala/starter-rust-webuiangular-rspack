import { CommonModule } from '@angular/common';
import { Component, type OnDestroy, type OnInit } from '@angular/core';
import { errorInterceptor } from '../../core/error-interceptor';
import {
  type BackendErrorEntry,
  ErrorDashboardVM,
  type ErrorStats,
} from '../../viewmodels/error-dashboard.viewmodel';

@Component({
  selector: 'app-error-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-dashboard">
      <div class="error-dashboard__header">
        <h2>🚨 Error Dashboard</h2>
        <div class="error-dashboard__actions">
          <button type="button" class="btn btn--refresh" (click)="refresh()" title="Refresh">
            🔄
          </button>
          <button type="button" class="btn btn--clear" (click)="clear()" title="Clear History">
            🗑️
          </button>
          <button type="button" class="btn btn--console" (click)="printToConsole()" title="Print to Console">
            📋
          </button>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="error-dashboard__stats">
        <div class="stat-card stat-card--total">
          <div class="stat-card__value">{{ totalErrors }}</div>
          <div class="stat-card__label">Total Errors</div>
        </div>
        <div class="stat-card stat-card--critical">
          <div class="stat-card__value">{{ stats.critical }}</div>
          <div class="stat-card__label">Critical</div>
        </div>
        <div class="stat-card stat-card--errors">
          <div class="stat-card__value">{{ stats.errors }}</div>
          <div class="stat-card__label">Errors</div>
        </div>
        <div class="stat-card stat-card--warnings">
          <div class="stat-card__value">{{ stats.warnings }}</div>
          <div class="stat-card__label">Warnings</div>
        </div>
      </div>

      <!-- Frontend Stats -->
      <div class="error-dashboard__section">
        <h3>Frontend Errors</h3>
        <div class="error-dashboard__breakdown">
          <div class="breakdown-item">
            <span class="breakdown-item__label">Total:</span>
            <span class="breakdown-item__value">{{ frontendStats.total }}</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-item__label">Critical:</span>
            <span class="breakdown-item__value">{{ frontendStats.criticalCount }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Errors -->
      <div class="error-dashboard__section" *ngIf="recentErrors.length > 0">
        <h3>Recent Errors ({{ recentErrors.length }})</h3>
        <div class="error-dashboard__errors">
          @for (error of recentErrors; track error.id) {
            <div class="error-card" [class]="'error-card--' + (error.severity.toLowerCase())">
              <div class="error-card__header">
                <span class="error-card__severity" [style.backgroundColor]="getSeverityColor(error.severity)">
                  {{ error.severity }}
                </span>
                <span class="error-card__time">{{ formatTimestamp(error.timestamp) }}</span>
              </div>
              <div class="error-card__code">{{ error.code }}</div>
              <div class="error-card__message">{{ error.message }}</div>
              <div class="error-card__source">Source: {{ error.source }}</div>
              @if (error.details) {
                <details class="error-card__details">
                  <summary>Details</summary>
                  <pre>{{ error.details }}</pre>
                </details>
              }
            </div>
          }
        </div>
      </div>

      <!-- Empty State -->
      <div class="error-dashboard__empty" *ngIf="!hasErrors">
        <div class="empty-state">
          <span class="empty-state__icon">✅</span>
          <span class="empty-state__text">No errors recorded</span>
        </div>
      </div>

      <!-- Last Updated -->
      <div class="error-dashboard__footer">
        <small>Last updated: {{ lastUpdatedStr }}</small>
      </div>
    </div>
  `,
  styles: [
    `
    .error-dashboard {
      padding: 16px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .error-dashboard__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e0e0e0;
    }

    .error-dashboard__header h2 {
      margin: 0;
      font-size: 20px;
      color: #333;
    }

    .error-dashboard__actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.2s;
    }

    .btn:hover {
      background-color: #f0f0f0;
    }

    .error-dashboard__stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .stat-card {
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .stat-card--total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .stat-card--critical {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    }

    .stat-card--errors {
      background: linear-gradient(135deg, #fd7e14 0%, #e8590c 100%);
    }

    .stat-card--warnings {
      background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);
    }

    .stat-card__value {
      font-size: 32px;
      font-weight: bold;
    }

    .stat-card__label {
      font-size: 12px;
      margin-top: 4px;
      opacity: 0.9;
    }

    .error-dashboard__section {
      margin-bottom: 24px;
    }

    .error-dashboard__section h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: #555;
    }

    .error-dashboard__breakdown {
      display: flex;
      gap: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .breakdown-item {
      display: flex;
      gap: 8px;
    }

    .breakdown-item__label {
      font-weight: 500;
      color: #555;
    }

    .breakdown-item__value {
      color: #333;
      font-weight: 600;
    }

    .error-dashboard__errors {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .error-card {
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid #ccc;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .error-card--critical {
      border-left-color: #dc3545;
      background: #fff5f5;
    }

    .error-card--error {
      border-left-color: #fd7e14;
      background: #fff9f0;
    }

    .error-card--warning {
      border-left-color: #ffc107;
      background: #fffef0;
    }

    .error-card--info {
      border-left-color: #17a2b8;
      background: #f0f9ff;
    }

    .error-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .error-card__severity {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
    }

    .error-card__time {
      font-size: 12px;
      color: #888;
    }

    .error-card__code {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #666;
      margin-bottom: 6px;
    }

    .error-card__message {
      font-size: 14px;
      color: #333;
      margin-bottom: 6px;
    }

    .error-card__source {
      font-size: 12px;
      color: #888;
    }

    .error-card__details {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
    }

    .error-card__details summary {
      cursor: pointer;
      font-size: 12px;
      color: #0066cc;
    }

    .error-card__details pre {
      margin: 8px 0 0 0;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 11px;
      overflow-x: auto;
      max-height: 200px;
      overflow-y: auto;
    }

    .error-dashboard__empty {
      text-align: center;
      padding: 40px;
      color: #888;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .empty-state__icon {
      font-size: 48px;
    }

    .empty-state__text {
      font-size: 16px;
    }

    .error-dashboard__footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e0e0e0;
      text-align: right;
      color: #888;
    }
  `,
  ],
})
export class ErrorDashboardComponent implements OnInit, OnDestroy {
  stats: ErrorStats = { total: 0, errors: 0, warnings: 0, critical: 0 };
  recentErrors: BackendErrorEntry[] = [];
  frontendStats = { total: 0, criticalCount: 0 };
  totalErrors = 0;
  hasErrors = false;
  lastUpdatedStr = '';
  private refreshInterval?: number;

  ngOnInit(): void {
    this.refresh();
    // Auto-refresh every 5 seconds
    this.refreshInterval = window.setInterval(() => this.refresh(), 5000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  refresh(): void {
    ErrorDashboardVM.requestStats();
    ErrorDashboardVM.requestRecentErrors(10);
    ErrorDashboardVM.refreshFrontendStats();
    this.updateView();
  }

  clear(): void {
    ErrorDashboardVM.clearErrorHistory();
    errorInterceptor.clear();
    setTimeout(() => this.refresh(), 100);
  }

  printToConsole(): void {
    ErrorDashboardVM.printSummary();
  }

  private updateView(): void {
    this.stats = ErrorDashboardVM.stats();
    this.recentErrors = ErrorDashboardVM.recentErrors();
    this.frontendStats = {
      total: ErrorDashboardVM.frontendStats().total,
      criticalCount: ErrorDashboardVM.frontendStats().criticalCount,
    };
    this.totalErrors = ErrorDashboardVM.totalErrors();
    this.hasErrors = ErrorDashboardVM.hasErrors();

    const lastUpdated = ErrorDashboardVM.lastUpdated();
    this.lastUpdatedStr = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never';
  }

  getSeverityColor(severity: string): string {
    return ErrorDashboardVM.getSeverityColor(severity);
  }

  formatTimestamp(timestamp: number): string {
    return ErrorDashboardVM.formatTimestamp(timestamp);
  }
}
