// src/views/devtools/devtools.component.ts
// Comprehensive DevTools panel exposing backend and frontend internals

import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorDashboardVM } from '../../viewmodels/error-dashboard.viewmodel';
import { errorInterceptor } from '../../core/error-interceptor';
import { EventBusViewModel } from '../../viewmodels/event-bus.viewmodel';
import { getLogger } from '../../viewmodels/logger.viewmodel';

const logger = getLogger('devtools');

// Backend stats interfaces
export interface BackendStats {
  memory?: {
    heap_used: number;
    heap_total: number;
    rss: number;
  };
  database?: {
    connections: number;
    idle_connections: number;
    utilization: number;
  };
  errors?: {
    total: number;
    errors: number;
    warnings: number;
    critical: number;
  };
  uptime?: number;
}

// Frontend stats interfaces
export interface FrontendStats {
  memory?: {
    jsHeapSize: number;
    usedJSHeapSize: number;
  };
  events: {
    total: number;
    byType: Map<string, number>;
  };
  errors: {
    total: number;
    bySource: Map<string, number>;
    byCode: Map<string, number>;
  };
  logs: {
    total: number;
    byLevel: Map<string, number>;
  };
}

// Log entry interface
export interface DevLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  context?: Record<string, unknown>;
}

@Component({
  selector: 'app-devtools',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="devtools">
      <!-- DevTools Header -->
      <div class="devtools__header">
        <h3>🛠️ DevTools Panel</h3>
        <div class="devtools__actions">
          <button type="button" class="btn btn--icon" (click)="refreshAll()" title="Refresh All">
            🔄
          </button>
          <button type="button" class="btn btn--icon" (click)="clearAll()" title="Clear All">
            🗑️
          </button>
        </div>
      </div>

      <!-- DevTools Tabs -->
      <div class="devtools__tabs">
        @for (tab of tabs; track tab.id) {
          <button type="button" 
                  class="devtools__tab" 
                  [class.active]="activeTab() === tab.id"
                  (click)="setActiveTab(tab.id)">
            {{ tab.icon }} {{ tab.label }}
            @if (tab.badge) {
              <span class="devtools__badge">{{ tab.badge }}</span>
            }
          </button>
        }
      </div>

      <!-- Tab Content -->
      <div class="devtools__content">
        
        <!-- Backend Tab -->
        @if (activeTab() === 'backend') {
          <div class="devtools-panel">
            <div class="panel-section">
              <h4>📊 Backend Statistics</h4>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-card__value">{{ backendStats.uptime || 0 }}</div>
                  <div class="stat-card__label">Uptime (seconds)</div>
                </div>
                @if (backendStats.memory) {
                  <div class="stat-card">
                    <div class="stat-card__value">{{ (backendStats.memory.heap_used / 1024 / 1024).toFixed(1) }} MB</div>
                    <div class="stat-card__label">Heap Used</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-card__value">{{ (backendStats.memory.rss / 1024 / 1024).toFixed(1) }} MB</div>
                    <div class="stat-card__label">RSS Memory</div>
                  </div>
                }
                @if (backendStats.database) {
                  <div class="stat-card">
                    <div class="stat-card__value">{{ backendStats.database.connections }}</div>
                    <div class="stat-card__label">DB Connections</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-card__value">{{ backendStats.database.utilization.toFixed(0) }}%</div>
                    <div class="stat-card__label">DB Utilization</div>
                  </div>
                }
                @if (backendStats.errors) {
                  <div class="stat-card stat-card--error">
                    <div class="stat-card__value">{{ backendStats.errors.total }}</div>
                    <div class="stat-card__label">Total Errors</div>
                  </div>
                  <div class="stat-card stat-card--critical">
                    <div class="stat-card__value">{{ backendStats.errors.critical }}</div>
                    <div class="stat-card__label">Critical</div>
                  </div>
                }
              </div>
            </div>

            <div class="panel-section">
              <h4>🔌 WebUI Bindings</h4>
              <div class="bindings-list">
                @for (binding of webuiBindings; track binding) {
                  <div class="binding-item">
                    <span class="binding-name">{{ binding }}</span>
                    <span class="binding-status status-ok">Active</span>
                  </div>
                }
              </div>
            </div>

            <div class="panel-section">
              <h4>📜 Backend Logs (Last 20)</h4>
              <div class="logs-container">
                @for (log of backendLogs; track log.timestamp) {
                  <div class="log-entry" [class]="'log-entry--' + log.level">
                    <span class="log-entry__time">{{ formatTime(log.timestamp) }}</span>
                    <span class="log-entry__level">{{ log.level }}</span>
                    <span class="log-entry__source">{{ log.source }}</span>
                    <span class="log-entry__message">{{ log.message }}</span>
                  </div>
                } @empty {
                  <div class="empty-state">No backend logs available</div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Frontend Tab -->
        @if (activeTab() === 'frontend') {
          <div class="devtools-panel">
            <div class="panel-section">
              <h4>📊 Frontend Statistics</h4>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-card__value">{{ frontendStats.events.total }}</div>
                  <div class="stat-card__label">Events Published</div>
                </div>
                <div class="stat-card">
                  <div class="stat-card__value">{{ frontendStats.errors.total }}</div>
                  <div class="stat-card__label">Errors Captured</div>
                </div>
                <div class="stat-card">
                  <div class="stat-card__value">{{ frontendStats.logs.total }}</div>
                  <div class="stat-card__label">Log Entries</div>
                </div>
                @if (performanceStats.memory && performanceStats.memory.usedJSHeapSize) {
                  <div class="stat-card">
                    <div class="stat-card__value">{{ (performanceStats.memory.usedJSHeapSize / 1024 / 1024).toFixed(1) }} MB</div>
                    <div class="stat-card__label">JS Heap</div>
                  </div>
                }
              </div>
            </div>

            <div class="panel-section">
              <h4>📡 Event Bus</h4>
              <div class="event-stats">
                <div class="event-stat">
                  <span class="event-stat__label">Subscribers:</span>
                  <span class="event-stat__value">{{ eventBusStats.listeners }}</span>
                </div>
                <div class="event-stat">
                  <span class="event-stat__label">History Size:</span>
                  <span class="event-stat__value">{{ eventBusStats.historySize }}</span>
                </div>
                <div class="event-stat">
                  <span class="event-stat__label">Enabled:</span>
                  <span class="event-stat__value">{{ eventBusStats.enabled ? '✓' : '✗' }}</span>
                </div>
              </div>
              <h5>Recent Events</h5>
              <div class="events-list">
                @for (event of recentEvents; track event.id) {
                  <div class="event-item">
                    <span class="event-item__time">{{ formatTime(event.timestamp) }}</span>
                    <span class="event-item__name">{{ event.name }}</span>
                    <span class="event-item__payload">{{ formatPayload(event.payload) }}</span>
                  </div>
                } @empty {
                  <div class="empty-state">No events recorded</div>
                }
              </div>
            </div>

            <div class="panel-section">
              <h4>🐛 Error Interceptor Stats</h4>
              <div class="error-stats">
                <div class="error-stat">
                  <span class="error-stat__label">Total:</span>
                  <span class="error-stat__value">{{ errorStats.total }}</span>
                </div>
                <div class="error-stat">
                  <span class="error-stat__label">Critical:</span>
                  <span class="error-stat__value error-stat--critical">{{ errorStats.criticalCount }}</span>
                </div>
              </div>
              <h5>Errors by Source</h5>
              <div class="breakdown-list">
                @for (entry of errorStats.bySource | keyvalue; track entry.key) {
                  <div class="breakdown-item">
                    <span class="breakdown-item__label">{{ entry.key }}</span>
                    <span class="breakdown-item__value">{{ entry.value }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="panel-section">
              <h4>📜 Frontend Logs (Last 20)</h4>
              <div class="logs-container">
                @for (log of frontendLogs; track log.timestamp) {
                  <div class="log-entry" [class]="'log-entry--' + log.level">
                    <span class="log-entry__time">{{ formatTime(log.timestamp) }}</span>
                    <span class="log-entry__level">{{ log.level }}</span>
                    <span class="log-entry__source">{{ log.source }}</span>
                    <span class="log-entry__message">{{ log.message }}</span>
                  </div>
                } @empty {
                  <div class="empty-state">No frontend logs available</div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Environment Tab -->
        @if (activeTab() === 'environment') {
          <div class="devtools-panel">
            <div class="panel-section">
              <h4>🌍 Environment</h4>
              <div class="env-grid">
                <div class="env-item">
                  <span class="env-label">User Agent:</span>
                  <span class="env-value">{{ userAgent }}</span>
                </div>
                <div class="env-item">
                  <span class="env-label">Language:</span>
                  <span class="env-value">{{ language }}</span>
                </div>
                <div class="env-item">
                  <span class="env-label">Platform:</span>
                  <span class="env-value">{{ platform }}</span>
                </div>
                <div class="env-item">
                  <span class="env-label">Screen:</span>
                  <span class="env-value">{{ screenResolution }}</span>
                </div>
                <div class="env-item">
                  <span class="env-label">Timezone:</span>
                  <span class="env-value">{{ timezone }}</span>
                </div>
                <div class="env-item">
                  <span class="env-label">Cookies Enabled:</span>
                  <span class="env-value">{{ cookiesEnabled ? 'Yes' : 'No' }}</span>
                </div>
                <div class="env-item">
                  <span class="env-label">Online:</span>
                  <span class="env-value">{{ online ? 'Yes' : 'No' }}</span>
                </div>
                <div class="env-item">
                  <span class="env-label">WebUI Port:</span>
                  <span class="env-value">{{ webuiPort || 'Unknown' }}</span>
                </div>
              </div>
            </div>

            <div class="panel-section">
              <h4>🔧 Feature Flags</h4>
              <div class="features-list">
                @for (feature of featureFlags | keyvalue; track feature.key) {
                  <div class="feature-item">
                    <span class="feature-name">{{ feature.key }}</span>
                    <span class="feature-status" [class.feature-enabled]="feature.value">
                      {{ feature.value ? '✓ Enabled' : '✗ Disabled' }}
                    </span>
                  </div>
                }
              </div>
            </div>

            <div class="panel-section">
              <h4>📦 Dependencies</h4>
              <div class="deps-list">
                @for (dep of dependencies | keyvalue; track dep.key) {
                  <div class="dep-item">
                    <span class="dep-name">{{ dep.key }}</span>
                    <span class="dep-version">{{ dep.value }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Actions Tab -->
        @if (activeTab() === 'actions') {
          <div class="devtools-panel">
            <div class="panel-section">
              <h4>⚡ Quick Actions</h4>
              <div class="actions-grid">
                <button type="button" class="action-btn" (click)="triggerGC()">
                  🗑️ Force GC
                </button>
                <button type="button" class="action-btn" (click)="clearLocalStorage()">
                  🧹 Clear LocalStorage
                </button>
                <button type="button" class="action-btn" (click)="clearErrorHistory()">
                  🗑️ Clear Error History
                </button>
                <button type="button" class="action-btn" (click)="exportState()">
                  📤 Export State
                </button>
                <button type="button" class="action-btn" (click)="importState()">
                  📥 Import State
                </button>
                <button type="button" class="action-btn" (click)="resetApplication()">
                  ⚠️ Reset App
                </button>
              </div>
            </div>

            <div class="panel-section">
              <h4>🧪 Test Scenarios</h4>
              <div class="test-list">
                <button type="button" class="test-btn" (click)="testBackendError()">
                  🔴 Trigger Backend Error
                </button>
                <button type="button" class="test-btn" (click)="testFrontendError()">
                  🔴 Trigger Frontend Error
                </button>
                <button type="button" class="test-btn" (click)="testNetworkError()">
                  🌐 Trigger Network Error
                </button>
                <button type="button" class="test-btn" (click)="testValidationError()">
                  ⚠️ Trigger Validation Error
                </button>
              </div>
            </div>

            <div class="panel-section">
              <h4>📊 Performance Tests</h4>
              <div class="test-list">
                <button type="button" class="test-btn" (click)="benchmarkEventBus()">
                  📈 Benchmark Event Bus
                </button>
                <button type="button" class="test-btn" (click)="benchmarkSignals()">
                  📈 Benchmark Signals
                </button>
                <button type="button" class="test-btn" (click)="measureRenderTime()">
                  ⏱️ Measure Render Time
                </button>
              </div>
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .devtools {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background: #1e1e1e;
      color: #d4d4d4;
    }

    .devtools__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #252526;
      border-bottom: 1px solid #3c3c3c;
    }

    .devtools__header h3 {
      margin: 0;
      font-size: 14px;
      color: #fff;
    }

    .devtools__actions {
      display: flex;
      gap: 4px;
    }

    .btn--icon {
      background: #3c3c3c;
      border: none;
      color: #d4d4d4;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn--icon:hover {
      background: #4c4c4c;
    }

    .devtools__tabs {
      display: flex;
      gap: 2px;
      padding: 4px 8px;
      background: #252526;
      border-bottom: 1px solid #3c3c3c;
      overflow-x: auto;
    }

    .devtools__tab {
      background: transparent;
      border: none;
      color: #858585;
      padding: 6px 12px;
      border-radius: 4px 4px 0 0;
      cursor: pointer;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
    }

    .devtools__tab:hover {
      background: #2a2a2a;
      color: #d4d4d4;
    }

    .devtools__tab.active {
      background: #1e1e1e;
      color: #fff;
    }

    .devtools__badge {
      background: #c7254e;
      color: #fff;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
    }

    .devtools__content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .devtools-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .panel-section {
      background: #252526;
      border-radius: 6px;
      padding: 12px;
    }

    .panel-section h4 {
      margin: 0 0 12px 0;
      font-size: 13px;
      color: #fff;
      border-bottom: 1px solid #3c3c3c;
      padding-bottom: 8px;
    }

    .panel-section h5 {
      margin: 12px 0 8px 0;
      font-size: 12px;
      color: #858585;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }

    .stat-card {
      background: #1e1e1e;
      padding: 12px;
      border-radius: 4px;
      text-align: center;
      border-left: 3px solid #007acc;
    }

    .stat-card--error {
      border-left-color: #c7254e;
    }

    .stat-card--critical {
      border-left-color: #ff6b6b;
    }

    .stat-card__value {
      font-size: 20px;
      font-weight: bold;
      color: #fff;
    }

    .stat-card__label {
      font-size: 10px;
      color: #858585;
      margin-top: 4px;
    }

    .bindings-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .binding-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      background: #1e1e1e;
      border-radius: 4px;
    }

    .binding-name {
      font-family: 'Courier New', monospace;
      color: #9cdcfe;
    }

    .binding-status {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .status-ok {
      background: #2e7d32;
      color: #fff;
    }

    .logs-container {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 300px;
      overflow-y: auto;
    }

    .log-entry {
      display: grid;
      grid-template-columns: 60px 50px 80px 1fr;
      gap: 8px;
      padding: 4px 8px;
      background: #1e1e1e;
      border-radius: 4px;
      font-size: 11px;
      align-items: center;
    }

    .log-entry--error {
      border-left: 2px solid #c7254e;
    }

    .log-entry--warn {
      border-left: 2px solid #ffc107;
    }

    .log-entry--info {
      border-left: 2px solid #007acc;
    }

    .log-entry--debug {
      border-left: 2px solid #6c757d;
    }

    .log-entry__time {
      color: #858585;
    }

    .log-entry__level {
      text-transform: uppercase;
      font-weight: bold;
    }

    .log-entry--error .log-entry__level {
      color: #c7254e;
    }

    .log-entry--warn .log-entry__level {
      color: #ffc107;
    }

    .log-entry--info .log-entry__level {
      color: #007acc;
    }

    .log-entry--debug .log-entry__level {
      color: #6c757d;
    }

    .log-entry__source {
      color: #4ec9b0;
    }

    .log-entry__message {
      color: #d4d4d4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .event-stats {
      display: flex;
      gap: 16px;
      padding: 8px;
      background: #1e1e1e;
      border-radius: 4px;
    }

    .event-stat {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .event-stat__label {
      color: #858585;
    }

    .event-stat__value {
      color: #fff;
      font-weight: bold;
    }

    .events-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 200px;
      overflow-y: auto;
    }

    .event-item {
      display: grid;
      grid-template-columns: 60px 100px 1fr;
      gap: 8px;
      padding: 6px 8px;
      background: #1e1e1e;
      border-radius: 4px;
      font-size: 11px;
      align-items: center;
    }

    .event-item__time {
      color: #858585;
    }

    .event-item__name {
      color: #9cdcfe;
    }

    .event-item__payload {
      color: #d4d4d4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .error-stats {
      display: flex;
      gap: 16px;
      padding: 8px;
      background: #1e1e1e;
      border-radius: 4px;
    }

    .error-stat {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .error-stat__label {
      color: #858585;
    }

    .error-stat__value {
      color: #fff;
      font-weight: bold;
    }

    .error-stat--critical {
      color: #c7254e;
    }

    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 8px;
      background: #1e1e1e;
      border-radius: 4px;
    }

    .breakdown-item__label {
      color: #858585;
    }

    .breakdown-item__value {
      color: #fff;
    }

    .signals-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .signal-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 8px;
      background: #1e1e1e;
      border-radius: 4px;
    }

    .signal-name {
      color: #9cdcfe;
    }

    .signal-value {
      color: #ce9178;
    }

    .env-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 8px;
    }

    .env-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px;
      background: #1e1e1e;
      border-radius: 4px;
    }

    .env-label {
      color: #858585;
      font-size: 10px;
    }

    .env-value {
      color: #d4d4d4;
      font-size: 11px;
    }

    .features-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .feature-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 8px;
      background: #1e1e1e;
      border-radius: 4px;
    }

    .feature-name {
      color: #9cdcfe;
    }

    .feature-status {
      color: #858585;
    }

    .feature-enabled {
      color: #4caf50;
    }

    .deps-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 200px;
      overflow-y: auto;
    }

    .dep-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 8px;
      background: #1e1e1e;
      border-radius: 4px;
    }

    .dep-name {
      color: #9cdcfe;
    }

    .dep-version {
      color: #858585;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px;
    }

    .action-btn {
      background: #0e639c;
      border: none;
      color: #fff;
      padding: 10px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      text-align: left;
    }

    .action-btn:hover {
      background: #1177bb;
    }

    .test-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .test-btn {
      background: #3c3c3c;
      border: none;
      color: #d4d4d4;
      padding: 10px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      text-align: left;
    }

    .test-btn:hover {
      background: #4c4c4c;
    }

    .test-btn:nth-child(odd) {
      background: #5a1a1a;
    }

    .test-btn:nth-child(odd):hover {
      background: #6a2a2a;
    }

    .empty-state {
      text-align: center;
      padding: 20px;
      color: #858585;
    }
  `],
})
export class DevtoolsComponent implements OnInit, OnDestroy {
  activeTab = signal<'backend' | 'frontend' | 'events' | 'environment' | 'actions'>('backend');
  
  tabs = [
    { id: 'backend' as const, label: 'Backend', icon: '🖥️', badge: undefined },
    { id: 'frontend' as const, label: 'Frontend', icon: '🎨', badge: undefined },
    { id: 'events' as const, label: 'Events', icon: '📡', badge: undefined },
    { id: 'environment' as const, label: 'Environment', icon: '🌍', badge: undefined },
    { id: 'actions' as const, label: 'Actions', icon: '⚡', badge: undefined },
  ];

  // Backend stats
  backendStats: BackendStats = {};
  backendLogs: DevLogEntry[] = [];
  webuiBindings: string[] = [];

  // Frontend stats
  frontendStats: FrontendStats = {
    events: { total: 0, byType: new Map() },
    errors: { total: 0, bySource: new Map(), byCode: new Map() },
    logs: { total: 0, byLevel: new Map() },
  };
  frontendLogs: DevLogEntry[] = [];
  recentEvents: Array<{ id: number; name: string; payload: unknown; timestamp: number }> = [];
  eventBusStats = { listeners: 0, historySize: 0, enabled: true };
  errorStats = { total: 0, criticalCount: 0, bySource: new Map(), byCode: new Map() };
  performanceStats: { memory?: { jsHeapSize?: number; usedJSHeapSize?: number } } = {};

  // Environment
  userAgent = '';
  language = '';
  platform = '';
  screenResolution = '';
  timezone = '';
  cookiesEnabled = false;
  online = false;
  webuiPort: number | null = null;
  featureFlags: Record<string, boolean> = {};
  dependencies: Record<string, string> = {};

  private refreshInterval?: number;
  private eventBus: EventBusViewModel<Record<string, unknown>>;

  constructor() {
    const debugWindow = window as unknown as {
      __FRONTEND_EVENT_BUS__?: EventBusViewModel<Record<string, unknown>>;
      __WEBUI_PORT?: number;
    };
    this.eventBus = debugWindow.__FRONTEND_EVENT_BUS__ ?? new EventBusViewModel();
    this.webuiPort = debugWindow.__WEBUI_PORT ?? null;
  }

  ngOnInit(): void {
    this.collectEnvironmentInfo();
    this.setupEventListeners();
    this.refreshAll();
    this.refreshInterval = window.setInterval(() => this.refreshAll(), 3000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  setActiveTab(tabId: 'backend' | 'frontend' | 'events' | 'environment' | 'actions'): void {
    this.activeTab.set(tabId);
  }

  refreshAll(): void {
    this.refreshBackendStats();
    this.refreshFrontendStats();
    this.collectLogs();
  }

  clearAll(): void {
    this.backendLogs = [];
    this.frontendLogs = [];
    errorInterceptor.clear();
  }

  private setupEventListeners(): void {
    // Listen for backend stats
    window.addEventListener('backend_stats_response', (event: Event) => {
      const customEvent = event as CustomEvent;
      this.backendStats = customEvent.detail as BackendStats;
    });

    // Listen for DB pool stats
    window.addEventListener('db_pool_stats_response', (event: Event) => {
      const customEvent = event as CustomEvent;
      const dbStats = customEvent.detail as {
        connections: number;
        idle_connections: number;
        utilization: number;
      };
      this.backendStats.database = {
        connections: dbStats.connections,
        idle_connections: dbStats.idle_connections,
        utilization: dbStats.utilization,
      };
    });

    // Listen for error stats
    window.addEventListener('error_stats_response', (event: Event) => {
      const customEvent = event as CustomEvent;
      const errorStats = customEvent.detail as {
        total: number;
        errors: number;
        warnings: number;
        critical: number;
      };
      this.backendStats.errors = errorStats;
    });
  }

  private refreshBackendStats(): void {
    const win = window as unknown as Record<string, unknown>;
    
    // Request backend stats
    if (typeof win.get_backend_stats === 'function') {
      win.get_backend_stats('backend_stats');
    }

    // Request DB pool stats
    if (typeof win.get_db_pool_stats === 'function') {
      win.get_db_pool_stats('db_pool_stats');
    }

    // Request error stats
    if (typeof win.get_error_stats === 'function') {
      win.get_error_stats('error_stats');
    }

    // Get WebUI bindings (static list)
    this.webuiBindings = [
      'open_folder', 'organize_images', 'increment_counter', 'reset_counter',
      'get_users', 'create_user', 'update_user', 'delete_user',
      'get_system_info', 'log_message', 'get_backend_logs',
      'event:publish', 'event:history', 'event:stats', 'event:clear_history',
      'window_state_change', 'get_error_stats', 'get_recent_errors',
      'clear_error_history', 'get_db_pool_stats'
    ];
  }

  private refreshFrontendStats(): void {
    // Get error interceptor stats
    const interceptorStats = errorInterceptor.getStats();
    this.frontendStats.errors.total = interceptorStats.total;
    this.frontendStats.errors.bySource = interceptorStats.bySource;
    this.frontendStats.errors.byCode = interceptorStats.byCode;
    this.errorStats.total = interceptorStats.total;
    this.errorStats.criticalCount = interceptorStats.criticalCount;
    this.errorStats.bySource = interceptorStats.bySource;
    this.errorStats.byCode = interceptorStats.byCode;

    // Get event bus stats
    this.eventBusStats = this.eventBus.stats();
    this.frontendStats.events.total = this.eventBusStats.historySize;

    // Get performance stats
    const perf = performance as unknown as { memory?: { jsHeapSize?: number; usedJSHeapSize?: number } };
    if (typeof performance !== 'undefined' && perf.memory) {
      this.performanceStats.memory = perf.memory;
    }

    // Get log history
    const logWindow = window as unknown as {
      __FRONTEND_LOGS__?: { getHistory: () => unknown[] };
    };
    if (logWindow.__FRONTEND_LOGS__) {
      const logs = logWindow.__FRONTEND_LOGS__.getHistory();
      this.frontendStats.logs.total = logs.length;
    }
  }

  private collectLogs(): void {
    // Collect frontend logs
    const logWindow = window as unknown as {
      __FRONTEND_LOGS__?: { getHistory: () => unknown[] };
    };
    if (logWindow.__FRONTEND_LOGS__) {
      const logs = logWindow.__FRONTEND_LOGS__.getHistory().slice(-20) as DevLogEntry[];
      this.frontendLogs = logs;
    }

    // Request backend logs
    const win = window as unknown as Record<string, unknown>;
    if (typeof win.get_backend_logs === 'function') {
      win.get_backend_logs('backend_logs:20');
    }
  }

  private collectEnvironmentInfo(): void {
    this.userAgent = navigator.userAgent;
    this.language = navigator.language;
    this.platform = navigator.platform;
    this.screenResolution = `${screen.width}x${screen.height}`;
    this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.cookiesEnabled = navigator.cookieEnabled;
    this.online = navigator.onLine;

    // Feature flags (example)
    this.featureFlags = {
      'Dark Mode': true,
      'Error Tracking': true,
      'Event Bus': true,
      'DevTools': true,
      'WebUI Bridge': true,
    };

    // Dependencies (would need to be injected from package.json or build)
    this.dependencies = {
      '@angular/core': '21.1.5',
      'rxjs': '7.8.2',
      'zone.js': '0.15.1',
      'winbox': '0.2.82',
    };
  }

  // Actions
  triggerGC(): void {
    const win = window as unknown as { gc?: () => void };
    if (typeof win.gc === 'function') {
      win.gc();
      alert('Garbage collection triggered');
    } else {
      alert('GC not available. Run with --expose-gc flag.');
    }
  }

  clearLocalStorage(): void {
    localStorage.clear();
    sessionStorage.clear();
    alert('Storage cleared');
  }

  clearErrorHistory(): void {
    errorInterceptor.clear();
    const win = window as unknown as Record<string, unknown>;
    if (typeof win.clear_error_history === 'function') {
      win.clear_error_history('clear_error_history');
    }
    alert('Error history cleared');
  }

  exportState(): void {
    const state = {
      backendStats: this.backendStats,
      frontendStats: this.frontendStats,
      environment: {
        userAgent: this.userAgent,
        language: this.language,
        platform: this.platform,
      },
      timestamp: Date.now(),
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devtools-state-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importState(): void {
    alert('Import functionality would open file picker');
  }

  resetApplication(): void {
    if (confirm('Are you sure you want to reset the application? This will clear all state.')) {
      localStorage.clear();
      location.reload();
    }
  }

  // Test scenarios
  testBackendError(): void {
    const win = window as unknown as Record<string, unknown>;
    if (typeof win.create_backend_error === 'function') {
      win.create_backend_error('create_backend_error:test_error');
    } else {
      alert('Backend error handler not available');
    }
  }

  testFrontendError(): void {
    throw new Error('Test error from DevTools');
  }

  testNetworkError(): void {
    fetch('/api/nonexistent-endpoint')
      .then(response => console.log('Response:', response))
      .catch(error => console.error('Network error:', error));
  }

  testValidationError(): void {
    const errorServiceWindow = window as unknown as {
      __FRONTEND_EVENT_BUS__?: { publish: (name: string, payload: unknown) => void };
    };
    errorServiceWindow.__FRONTEND_EVENT_BUS__?.publish('error:captured', {
      code: 'validation_failed',
      message: 'Test validation error',
      field: 'email',
    });
  }

  // Benchmarks
  benchmarkEventBus(): void {
    const iterations = 10000;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      this.eventBus.publish('benchmark:event', { index: i });
    }
    
    const end = performance.now();
    const duration = end - start;
    const perSecond = (iterations / duration) * 1000;
    
    alert(`Event Bus Benchmark:\n${iterations} events in ${duration.toFixed(2)}ms\n${perSecond.toFixed(0)} events/second`);
  }

  benchmarkSignals(): void {
    alert('Signal benchmark would measure signal update/read performance');
  }

  measureRenderTime(): void {
    const start = performance.now();
    // Force reflow
    document.body.offsetHeight;
    const end = performance.now();
    alert(`Render time: ${(end - start).toFixed(2)}ms`);
  }

  // Utilities
  formatTime(timestamp: number | string): string {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleTimeString();
  }

  formatPayload(payload: unknown): string {
    if (typeof payload === 'object' && payload !== null) {
      return JSON.stringify(payload).slice(0, 50) + '...';
    }
    return String(payload);
  }
}
