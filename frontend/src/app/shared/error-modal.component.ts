import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { RootErrorState } from '../../error/global-error.service';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (error) {
      <div class="error-backdrop" (click)="dismissed.emit()">
        <section
          class="error-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Application error"
          (click)="$event.stopPropagation()"
        >
          <header class="error-header">
            <h2 class="error-title">{{ error.title }}</h2>
            <button type="button" class="error-close" (click)="dismissed.emit()" aria-label="Close error dialog">✕</button>
          </header>
          <p class="error-message">{{ error.message }}</p>
          <p class="error-meta">Source: {{ error.source }} | {{ error.timestamp }}</p>
          @if (error.details) {
            <pre class="error-details">{{ error.details }}</pre>
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
      margin-bottom: 8px;
    }

    .error-title {
      margin: 0;
      font-size: 18px;
      line-height: 1.2;
    }

    .error-close {
      border: none;
      background: #f2f4fa;
      color: #394056;
      width: 30px;
      height: 30px;
      border-radius: 6px;
      cursor: pointer;
    }

    .error-message {
      margin: 0 0 8px;
      line-height: 1.45;
      color: #2a3246;
    }

    .error-meta {
      margin: 0 0 10px;
      font-size: 12px;
      color: #667089;
    }

    .error-details {
      margin: 0;
      background: #0f1322;
      color: #e3ecff;
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
      line-height: 1.4;
      overflow: auto;
    }
  `],
})
export class ErrorModalComponent {
  @Input() error: RootErrorState | null = null;
  @Output() dismissed = new EventEmitter<void>();
}
