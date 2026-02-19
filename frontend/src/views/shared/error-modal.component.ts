import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RootErrorState } from '../../core/global-error.service';
import { ErrorCode } from '../../types/error.types';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (error) {
      <div class="error-backdrop" (click)="dismissed.emit()">
        <section class="error-modal" role="dialog" aria-modal="true" aria-label="Application error" (click)="$event.stopPropagation()">
          <header class="error-header">
            <h2 class="error-title">{{ error.title }}</h2>
            <button type="button" class="error-close" (click)="dismissed.emit()" aria-label="Close error dialog">✕</button>
          </header>
          
          <p class="error-message">{{ error.userMessage }}</p>
          
          <div class="error-meta">
            <span class="error-code" [title]="error.error.code">{{ getErrorIcon(error.error.code) }}</span>
            <span class="error-source">{{ error.source }}</span>
            <span class="error-timestamp">{{ error.timestamp }}</span>
          </div>
          
          @if (error.error.field) {
            <p class="error-field">Field: <strong>{{ error.error.field }}</strong></p>
          }
          
          @if (error.error.details) {
            <details class="error-details-block">
              <summary>Technical Details</summary>
              <pre class="error-details">{{ error.error.details }}</pre>
            </details>
          }
          
          @if (error.error.cause) {
            <div class="error-cause">
              <strong>Cause:</strong> {{ error.error.cause }}
            </div>
          }
        </section>
      </div>
    }
  `,
  styles: [`
    .error-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(5, 6, 12, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
      box-sizing: border-box;
      backdrop-filter: blur(2px);
    }

    .error-modal {
      width: min(640px, 100%);
      max-height: 80vh;
      overflow: auto;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e6e8ef;
      box-shadow: 0 18px 48px rgba(12, 16, 35, 0.24);
      padding: 16px;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #1d2433;
    }

    .error-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }

    .error-title {
      margin: 0;
      font-size: 18px;
      line-height: 1.2;
      font-weight: 600;
    }

    .error-close {
      border: none;
      background: #f2f4fa;
      color: #394056;
      width: 30px;
      height: 30px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .error-message {
      margin: 0 0 12px;
      line-height: 1.5;
      color: #2a3246;
      font-size: 14px;
    }

    .error-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 10px;
      font-size: 12px;
      color: #667089;
    }

    .error-code {
      background: #f2f4fa;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'SF Mono', 'Consolas', monospace;
      font-size: 11px;
    }

    .error-source {
      flex: 1;
    }

    .error-timestamp {
      color: #8892a8;
    }

    .error-field {
      margin: 0 0 10px;
      font-size: 13px;
      color: #394056;
    }

    .error-details-block {
      margin: 0 0 10px;
      border: 1px solid #e6e8ef;
      border-radius: 6px;
      background: #f9fafb;
    }

    .error-details-block summary {
      padding: 8px 12px;
      cursor: pointer;
      font-size: 13px;
      color: #394056;
      user-select: none;
    }

    .error-details-block summary:hover {
      background: #f2f4fa;
    }

    .error-details {
      margin: 0;
      background: #0f1322;
      color: #e3ecff;
      border-radius: 0 0 8px 8px;
      padding: 12px;
      font-size: 12px;
      line-height: 1.5;
      overflow: auto;
      font-family: 'SF Mono', 'Consolas', monospace;
      max-height: 200px;
    }

    .error-cause {
      margin: 0 0 10px;
      padding: 8px 12px;
      background: #fff5f5;
      border-left: 3px solid #fc8181;
      border-radius: 4px;
      font-size: 13px;
      color: #c53030;
    }
  `],
})
export class ErrorModalComponent {
  @Input() error: RootErrorState | null = null;
  @Output() dismissed = new EventEmitter<void>();

  getErrorIcon(code: ErrorCode): string {
    switch (code) {
      case ErrorCode.ValidationFailed:
        return '⚠️';
      case ErrorCode.ResourceNotFound:
      case ErrorCode.UserNotFound:
      case ErrorCode.EntityNotFound:
        return '🔍';
      case ErrorCode.DbAlreadyExists:
        return '📋';
      case ErrorCode.InternalError:
      case ErrorCode.LockPoisoned:
        return '⚙️';
      default:
        return '❌';
    }
  }
}
