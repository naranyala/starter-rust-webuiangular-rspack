// frontend/src/error-handler.ts
// Global error handler with modal popup

interface ErrorDetails {
  message: string;
  stack?: string;
  type: 'uncaught' | 'unhandled' | 'logic' | 'network';
  timestamp: number;
  url?: string;
  line?: number;
  column?: number;
  context?: string;
}

interface ErrorModalConfig {
  title?: string;
  maxErrors?: number;
  showStack?: boolean;
  onError?: (error: ErrorDetails) => void;
  onClose?: () => void;
  darkMode?: boolean;
}

class ErrorModal {
  private static instance: ErrorModal;
  private errors: ErrorDetails[] = [];
  private config: Required<ErrorModalConfig>;
  private isVisible: boolean = false;
  private container: HTMLElement | null = null;

  private defaultConfig: Required<ErrorModalConfig> = {
    title: 'Error Occurred',
    maxErrors: 10,
    showStack: true,
    onError: () => {},
    onClose: () => {},
    darkMode: true
  };

  private constructor(config: ErrorModalConfig = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  static getInstance(config?: ErrorModalConfig): ErrorModal {
    if (!ErrorModal.instance) {
      ErrorModal.instance = new ErrorModal(config);
    }
    return ErrorModal.instance;
  }

  static init(config?: ErrorModalConfig): ErrorModal {
    const instance = ErrorModal.getInstance(config);
    instance.createStyles();
    instance.createContainer();
    instance.setupGlobalHandlers();
    return instance;
  }

  private createStyles(): void {
    if (document.getElementById('error-modal-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'error-modal-styles';
    styles.textContent = `
      .error-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }

      .error-modal-backdrop.visible {
        opacity: 1;
        visibility: visible;
      }

      .error-modal {
        background: ${this.config.darkMode ? '#1e1e2e' : '#ffffff'};
        border-radius: 12px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transform: scale(0.9) translateY(20px);
        transition: transform 0.3s ease;
      }

      .error-modal-backdrop.visible .error-modal {
        transform: scale(1) translateY(0);
      }

      .error-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid ${this.config.darkMode ? '#313244' : '#e5e7eb'};
      }

      .error-modal-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: ${this.config.darkMode ? '#cdd6f4' : '#1f2937'};
      }

      .error-modal-title svg {
        width: 24px;
        height: 24px;
        color: #f38ba8;
      }

      .error-modal-close {
               border: none background: transparent;
;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        color: ${this.config.darkMode ? '#a6adc8' : '#6b7280'};
        transition: background 0.2s ease;
      }

      .error-modal-close:hover {
        background: ${this.config.darkMode ? '#313244' : '#f3f4f6'};
      }

      .error-modal-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
      }

      .error-item {
        background: ${this.config.darkMode ? '#181825' : '#f9fafb'};
        border-radius: 8px;
        margin-bottom: 12px;
        overflow: hidden;
      }

      .error-item:last-child {
        margin-bottom: 0;
      }

      .error-item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        cursor: pointer;
        transition: background 0.2s ease;
      }

      .error-item-header:hover {
        background: ${this.config.darkMode ? '#313244' : '#f3f4f6'};
      }

      .error-item-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        color: ${this.config.darkMode ? '#cdd6f4' : '#1f2937'};
      }

      .error-type {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
        font-weight: 600;
      }

      .error-type.uncaught {
        background: #f38ba8;
        color: #181825;
      }

      .error-type.unhandled {
        background: #fab387;
        color: #181825;
      }

      .error-type.logic {
        background: #89b4fa;
        color: #181825;
      }

      .error-type.network {
        background: #a6e3a1;
        color: #181825;
      }

      .error-timestamp {
        font-size: 12px;
        color: ${this.config.darkMode ? '#6c7086' : '#9ca3af'};
      }

      .error-item-body {
        display: none;
        padding: 0 16px 16px;
        border-top: 1px solid ${this.config.darkMode ? '#313244' : '#e5e7eb'};
      }

      .error-item.expanded .error-item-body {
        display: block;
      }

      .error-message {
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 13px;
        color: ${this.config.darkMode ? '#f38ba8' : '#dc2626'};
        background: ${this.config.darkMode ? '#11111b' : '#fee2e2'};
        padding: 12px;
        border-radius: 6px;
        margin-top: 8px;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .error-stack {
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 11px;
        color: ${this.config.darkMode ? '#a6adc8' : '#4b5563'};
        background: ${this.config.darkMode ? '#11111b' : '#f3f4f6'};
        padding: 12px;
        border-radius: 6px;
        margin-top: 8px;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-all;
      }

      .error-context {
        font-size: 12px;
        color: ${this.config.darkMode ? '#9399b2' : '#6b7280'};
        margin-top: 8px;
      }

      .error-modal-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        border-top: 1px solid ${this.config.darkMode ? '#313244' : '#e5e7eb'};
        background: ${this.config.darkMode ? '#181825' : '#f9fafb'};
      }

      .error-count {
        font-size: 13px;
        color: ${this.config.darkMode ? '#6c7086' : '#9ca3af'};
      }

      .error-modal-actions {
        display: flex;
        gap: 8px;
      }

      .error-modal-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
      }

      .error-modal-btn.primary {
        background: #89b4fa;
        color: #181825;
      }

      .error-modal-btn.primary:hover {
        background: #b4befe;
      }

      .error-modal-btn.secondary {
        background: ${this.config.darkMode ? '#313244' : '#e5e7eb'};
        color: ${this.config.darkMode ? '#cdd6f4' : '#374151'};
      }

      .error-modal-btn.secondary:hover {
        background: ${this.config.darkMode ? '#45475a' : '#d1d5db'};
      }

      .error-modal-btn.danger {
        background: #f38ba8;
        color: #181825;
      }

      .error-modal-btn.danger:hover {
        background: #eba0ac;
      }
    `;
    document.head.appendChild(styles);
  }

  private createContainer(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'error-modal-backdrop';
    this.container.id = 'error-modal-container';
    this.container.innerHTML = `
      <div class="error-modal">
        <div class="error-modal-header">
          <h2 class="error-modal-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            ${this.config.title}
          </h2>
          <button class="error-modal-close" id="error-modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="error-modal-body" id="error-modal-body">
          <!-- Error items will be inserted here -->
        </div>
        <div class="error-modal-footer">
          <span class="error-count" id="error-count"></span>
          <div class="error-modal-actions">
            <button class="error-modal-btn secondary" id="error-clear-all">Clear All</button>
            <button class="error-modal-btn danger" id="error-reload">Reload Page</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Event listeners
    document.getElementById('error-modal-close')?.addEventListener('click', () => this.hide());
    document.getElementById('error-clear-all')?.addEventListener('click', () => this.clearAll());
    document.getElementById('error-reload')?.addEventListener('click', () => window.location.reload());
    
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }

  private setupGlobalHandlers(): void {
    // Uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
        type: 'uncaught',
        timestamp: Date.now(),
        url: event.filename,
        line: event.lineno,
        column: event.colno
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      this.handleError({
        message: error?.message || String(error) || 'Unhandled Promise Rejection',
        stack: error?.stack,
        type: 'unhandled',
        timestamp: Date.now()
      });
    });

    // Network errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          this.handleError({
            message: `HTTP ${response.status}: ${response.statusText}`,
            type: 'network',
            timestamp: Date.now(),
            context: `URL: ${args[0]}`
          });
        }
        return response;
      } catch (error: any) {
        this.handleError({
          message: error?.message || 'Network error',
          type: 'network',
          timestamp: Date.now(),
          context: `URL: ${args[0]}`
        });
        throw error;
      }
    };
  }

  handleError(error: ErrorDetails): void {
    // Prevent duplicate errors
    const isDuplicate = this.errors.some(
      e => e.message === error.message && e.timestamp - error.timestamp < 1000
    );
    if (isDuplicate && this.errors.length > 0) return;

    this.errors.unshift(error);
    
    // Trim old errors
    if (this.errors.length > this.config.maxErrors) {
      this.errors = this.errors.slice(0, this.config.maxErrors);
    }

    // Callback
    this.config.onError(error);

    // Show modal
    this.render();
    this.show();
  }

  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  private render(): void {
    const body = document.getElementById('error-modal-body');
    const countEl = document.getElementById('error-count');
    
    if (!body || !countEl) return;

    if (this.errors.length === 0) {
      body.innerHTML = '<p style="text-align: center; color: #6c7086;">No errors to display</p>';
      countEl.textContent = '';
      return;
    }

    countEl.textContent = `${this.errors.length} error${this.errors.length > 1 ? 's' : ''}`;

    body.innerHTML = this.errors.map((error, index) => `
      <div class="error-item" data-index="${index}">
        <div class="error-item-header">
          <div class="error-item-title">
            <span class="error-type ${error.type}">${error.type}</span>
            <span>${this.escapeHtml(error.message.substring(0, 80))}${error.message.length > 80 ? '...' : ''}</span>
          </div>
          <span class="error-timestamp">${this.formatTimestamp(error.timestamp)}</span>
        </div>
        <div class="error-item-body">
          ${error.context ? `<div class="error-context">${this.escapeHtml(error.context)}</div>` : ''}
          ${error.url ? `<div class="error-context">${this.escapeHtml(error.url)}${error.line ? `:${error.line}:${error.column}` : ''}</div>` : ''}
          <div class="error-message">${this.escapeHtml(error.message)}</div>
          ${this.config.showStack && error.stack ? `<div class="error-stack">${this.escapeHtml(error.stack)}</div>` : ''}
        </div>
      </div>
    `).join('');

    // Add click handlers for expansion
    body.querySelectorAll('.error-item-header').forEach(header => {
      header.addEventListener('click', () => {
        header.parentElement?.classList.toggle('expanded');
      });
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  show(): void {
    if (!this.container) return;
    this.container.classList.add('visible');
    this.isVisible = true;
  }

  hide(): void {
    if (!this.container) return;
    this.container.classList.remove('visible');
    this.isVisible = false;
    this.config.onClose();
  }

  clearAll(): void {
    this.errors = [];
    this.render();
    this.hide();
  }

  getErrors(): ErrorDetails[] {
    return [...this.errors];
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  isShowing(): boolean {
    return this.isVisible;
  }

  // Manual error reporting
  report(message: string, type: ErrorDetails['type'] = 'logic', context?: string): void {
    this.handleError({
      message,
      type,
      timestamp: Date.now(),
      context
    });
  }
}

// Initialize on import
if (typeof window !== 'undefined') {
  ErrorModal.init({
    title: 'Application Error',
    maxErrors: 10,
    showStack: true,
    darkMode: true,
    onError: (error) => {
      console.error('[Global Error Handler]', error);
    }
  });
}

export { ErrorModal, ErrorDetails, ErrorModalConfig };
