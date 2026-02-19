import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getLogger } from '../viewmodels/logger';
import { ErrorModalComponent } from './shared/error-modal.component';
import { GlobalErrorService } from '../core/global-error.service';
import { EventBusViewModel } from '../viewmodels/event-bus.viewmodel';
import { WindowStateViewModel } from '../viewmodels/window-state.viewmodel';
import { Card, BottomPanelTab, WindowEntry } from '../models';

interface ConnectionStats {
  state: string;
  connected: boolean;
  lastError: string | null;
  port: string | null;
  latency: number;
  uptime: number;
  reconnects: number;
  pingSuccess: number;
  totalCalls: number;
  successfulCalls: number;
}

declare const WinBox: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ErrorModalComponent],
  template: `
    <div class="app-container" [class.sidebar-collapsed]="sidebarCollapsed()" [class.bottom-panel-collapsed]="bottomPanelCollapsed()">
      <div class="top-panel" [class.collapsed]="sidebarCollapsed()">
        <div class="panel-main" (click)="toggleSidebar()">
          <div class="top-bar-left">
            <span class="top-brand-icon">⚡</span>
            <span class="top-brand-name">TechHub</span>
          </div>
          <div class="top-bar-right">
            <span>{{ windowEntries().length }} windows</span>
            <span>{{ minimizedWindowCount() }} minimized</span>
          </div>
        </div>
        <div class="panel-content">
          <nav class="top-nav">
            <button class="nav-item" [class.active]="!hasFocusedWindow()" (click)="showMainMenu($event)">
              <span class="nav-icon">🏠</span>
              <span class="nav-label">Home</span>
            </button>
            @for (windowEntry of windowEntries(); track windowEntry.id) {
              <button class="nav-item" [class.active]="windowEntry.focused" (click)="activateWindow(windowEntry.id, $event)">
                <span class="nav-icon">{{ windowEntry.minimized ? '🗕' : '🗗' }}</span>
                <span class="nav-label">{{ windowEntry.title }}</span>
              </button>
            }
          </nav>
        </div>
      </div>

      <main class="main-content">
        <div class="search-container">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" placeholder="Fuzzy search technologies..." [value]="searchQuery()" (input)="onSearch($event)" />
          @if (searchQuery()) {
            <button type="button" class="clear-btn" (click)="clearSearch()">✕</button>
          }
        </div>
        <div class="cards-grid">
          @for (card of filteredCards(); track card.id) {
            <article class="card" [style.border-left-color]="card.color" (click)="openCard(card)">
              <div class="card-icon" [style.background]="card.color">{{ card.icon }}</div>
              <h3 class="card-title">{{ card.title }}</h3>
              <p class="card-description">{{ card.description }}</p>
              <span class="click-hint">Click to open</span>
            </article>
          } @empty {
            <div class="no-results">
              <span class="no-results-icon">🔎</span>
              <p>No matching cards for "{{ searchQuery() }}"</p>
            </div>
          }
        </div>
      </main>

      <div class="bottom-panel" [class.collapsed]="bottomPanelCollapsed()">
        <div class="ws-status-bar" [class.ws-connected]="wsConnectionState() === 'connected'" [class.ws-connecting]="wsConnectionState() === 'connecting'" [class.ws-disconnected]="wsConnectionState() === 'disconnected'" [class.ws-error]="wsConnectionState() === 'error'">
          <div class="ws-status-main" (click)="toggleWsDetails()">
            <div class="ws-status-indicator"></div>
            <span class="ws-status-text">WebSocket: {{ wsConnectionState() }}{{ wsPort() ? ' :' + wsPort() : '' }}{{ wsLastError() ? ' - ' + wsLastError() : '' }}</span>
          </div>
          <button class="ws-toggle-btn" type="button" (click)="toggleWsDetails(); $event.stopPropagation()">
            {{ wsDetailsExpanded() ? 'Collapse' : 'Expand' }}
          </button>
        </div>
        @if (wsDetailsExpanded()) {
          <div class="ws-details-panel">
            <div class="ws-metrics-grid">
              <div class="ws-metric-group">
                <span class="ws-group-label">Connection</span>
                <div class="ws-metrics-row">
                  <div class="ws-metric-item">
                    <span class="ws-metric-label">Status</span>
                    <span class="ws-metric-value" [class]="'ws-status-' + wsConnectionState()">{{ wsConnectionState() }}</span>
                  </div>
                  <div class="ws-metric-item">
                    <span class="ws-metric-label">Port</span>
                    <span class="ws-metric-value">{{ wsPort() || '-' }}</span>
                  </div>
                  <div class="ws-metric-item">
                    <span class="ws-metric-label">Latency</span>
                    <span class="ws-metric-value">{{ wsLatency() }}ms</span>
                  </div>
                </div>
              </div>
              <div class="ws-metric-group">
                <span class="ws-group-label">Reliability</span>
                <div class="ws-metrics-row">
                  <div class="ws-metric-item">
                    <span class="ws-metric-label">Uptime</span>
                    <span class="ws-metric-value">{{ formatUptime(wsUptime()) }}</span>
                  </div>
                  <div class="ws-metric-item">
                    <span class="ws-metric-label">Reconnects</span>
                    <span class="ws-metric-value">{{ wsReconnects() }}</span>
                  </div>
                  <div class="ws-metric-item">
                    <span class="ws-metric-label">Ping</span>
                    <span class="ws-metric-value">{{ wsPingSuccess() }}%</span>
                  </div>
                </div>
              </div>
              <div class="ws-metric-group">
                <span class="ws-group-label">Calls</span>
                <div class="ws-metrics-row">
                  <div class="ws-metric-item">
                    <span class="ws-metric-label">Total</span>
                    <span class="ws-metric-value">{{ wsTotalCalls() }}/{{ wsSuccessfulCalls() }}</span>
                  </div>
                  <div class="ws-metric-item ws-error-item">
                    <span class="ws-metric-label">Error</span>
                    <span class="ws-metric-value">{{ wsLastError() || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <div class="bottom-panel-tabs">
          @for (tab of bottomPanelTabs; track tab.id) {
            <button class="bottom-panel-tab" [class.active]="activeBottomTab() === tab.id" (click)="selectBottomTab(tab.id, $event)">
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-label">{{ tab.label }}</span>
            </button>
          }
        </div>
        <div class="panel-main" (click)="toggleBottomPanel()">
          <div class="panel-left">
            <span class="panel-text">⚡ TechHub v1.0.0</span>
          </div>
          <div class="panel-right">
            <span class="panel-text">{{ getCurrentTabInfo() }}</span>
          </div>
        </div>
        <div class="panel-content">
          <div class="panel-content-inner">
            @if (activeBottomTab() === 'overview') {
              <div class="tab-content overview-content">
                <span class="panel-text">Runtime: WebUI (GTK/WebKit)</span>
                <span class="panel-status" [class.connected]="wsConnectionState() === 'connected'">Status: {{ wsConnectionState() === 'connected' ? 'Ready' : wsConnectionState() }}</span>
              </div>
            } @else if (activeBottomTab() === 'metrics') {
              <div class="tab-content metrics-content">
                <span class="panel-text">Memory: 24.5 MB</span>
                <span class="panel-text">CPU: 2.3%</span>
                <span class="panel-text">Windows: {{ windowEntries().length }}</span>
              </div>
            } @else if (activeBottomTab() === 'events') {
              <div class="tab-content events-content">
                <span class="panel-text">Events: 12 today</span>
                <span class="panel-text">Errors: 0</span>
                <span class="panel-text">Last: 2m ago</span>
              </div>
            } @else if (activeBottomTab() === 'connection') {
              <div class="tab-content connection-content">
                <div class="ws-mini-stats">
                  <span class="ws-mini-item"><span class="ws-mini-label">Latency:</span> {{ wsLatency() }}ms</span>
                  <span class="ws-mini-item"><span class="ws-mini-label">Uptime:</span> {{ formatUptime(wsUptime()) }}</span>
                  <span class="ws-mini-item"><span class="ws-mini-label">Calls:</span> {{ wsTotalCalls() }}/{{ wsSuccessfulCalls() }}</span>
                </div>
              </div>
            } @else if (activeBottomTab() === 'info') {
              <div class="tab-content info-content">
                <span class="panel-text">Version: 1.0.0</span>
                <span class="panel-text">Build: 2024.02.18</span>
                <span class="panel-text">Tech: Angular + Rust</span>
              </div>
            }
          </div>
        </div>
      </div>

      <app-error-modal [error]="globalErrorService.activeError()" (dismissed)="globalErrorService.dismiss()" />
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }
    .app-container { display: flex; flex-direction: column; height: 100%; }
    
    .top-panel { position: fixed; top: 0; left: 0; right: 0; height: 72px; background: linear-gradient(90deg, #151529 0%, #1a1a2e 100%); display: flex; flex-direction: column; transition: height 0.3s ease; z-index: 220; }
    .top-panel.collapsed { height: 30px; }
    .top-bar-left { display: flex; align-items: center; gap: 8px; }
    .top-brand-name { color: #fff; font-size: 12px; font-weight: 600; letter-spacing: 0.2px; padding-top: 2px; }
    .top-bar-right { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.82); font-size: 11px; padding-top: 2px; }
    .nav-item { display: flex; align-items: center; gap: 8px; justify-content: center; min-width: 132px; padding: 8px 12px; background: rgba(255,255,255,0.06); border: none; border-radius: 6px; color: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.2s; text-align: left; font-size: 13px; }
    .nav-item:hover { background: rgba(255,255,255,0.1); color: white; }
    .nav-item.active { background: #667eea; color: white; }
    .nav-icon { font-size: 14px; text-align: center; }
    .nav-label { white-space: nowrap; }
    .top-nav { display: flex; align-items: center; justify-content: flex-start; gap: 10px; flex-wrap: nowrap; overflow-x: auto; width: 100%; }

    .main-content { flex: 1; margin-top: 72px; margin-bottom: 58px; overflow-y: auto; padding: 40px 20px; background: #f5f5f5; transition: margin-top 0.3s ease, margin-bottom 0.3s ease; }
    .sidebar-collapsed .main-content { margin-top: 30px; }
    .bottom-panel-collapsed .main-content { margin-bottom: 30px; }
    .search-container { position: relative; max-width: 500px; margin: 0 auto 16px; }
    .search-input { width: 100%; padding: 14px 44px 14px 44px; font-size: 16px; border: 2px solid #e0e0e0; border-radius: 12px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
    .search-input:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
    .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 18px; opacity: 0.5; }
    .clear-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: #e0e0e0; border: none; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
    .clear-btn:hover { background: #ccc; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .card { background: white; border-radius: 12px; padding: 24px; border-left: 4px solid; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; position: relative; }
    .card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px; }
    .card-title { margin: 0 0 8px; font-size: 18px; color: #333; }
    .card-description { margin: 0; color: #666; line-height: 1.5; font-size: 14px; }
    .click-hint { position: absolute; bottom: 12px; right: 16px; font-size: 12px; color: #999; opacity: 0; transition: opacity 0.2s; }
    .card:hover .click-hint { opacity: 1; }
    .no-results { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #888; }
    .no-results-icon { font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.5; }
    
    .bottom-panel { position: fixed; bottom: 0; left: 0; right: 0; height: 30px; background: #1a1a2e; transition: height 0.3s ease; z-index: 200; display: flex; flex-direction: column; }
    .bottom-panel.collapsed { height: 30px; }
    .bottom-panel:not(.collapsed) { height: 168px; }
    
    .ws-status-bar { display: flex; justify-content: space-between; align-items: center; height: 28px; padding: 0 12px; background: #0f0f1a; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .ws-status-main { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .ws-status-indicator { width: 8px; height: 8px; border-radius: 50%; background: #666; }
    .ws-connected .ws-status-indicator { background: #4ade80; }
    .ws-connecting .ws-status-indicator { background: #3b82f6; }
    .ws-disconnected .ws-status-indicator { background: #666; }
    .ws-error .ws-status-indicator { background: #ef4444; }
    .ws-status-text { color: rgba(255,255,255,0.85); font-size: 12px; font-family: monospace; }
    .ws-toggle-btn { background: rgba(255,255,255,0.1); border: none; color: rgba(255,255,255,0.7); padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; transition: all 0.2s; }
    .ws-toggle-btn:hover { background: rgba(255,255,255,0.2); color: white; }
    
    .ws-details-panel { background: #151529; padding: 8px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); max-height: 100px; overflow-y: auto; }
    .ws-metrics-grid { display: flex; gap: 24px; flex-wrap: wrap; }
    .ws-metric-group { display: flex; flex-direction: column; gap: 4px; min-width: 180px; }
    .ws-group-label { color: rgba(255,255,255,0.5); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .ws-metrics-row { display: flex; gap: 16px; }
    .ws-metric-item { display: flex; flex-direction: column; gap: 2px; }
    .ws-metric-label { color: rgba(255,255,255,0.6); font-size: 11px; }
    .ws-metric-value { color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 500; }
    .ws-status-connected { color: #4ade80; }
    .ws-status-connecting { color: #3b82f6; }
    .ws-status-disconnected { color: #9ca3af; }
    .ws-status-error { color: #ef4444; }
    .ws-status-retrying { color: #fbbf24; }
    .ws-error-item .ws-metric-value { color: #ef4444; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    
    .ws-mini-stats { display: flex; gap: 20px; justify-content: center; width: 100%; }
    .ws-mini-item { color: rgba(255,255,255,0.7); font-size: 12px; }
    .ws-mini-label { color: rgba(255,255,255,0.5); margin-right: 4px; }
    
    .bottom-panel-tabs { display: flex; align-items: center; gap: 4px; padding: 4px 8px 0; height: 28px; background: #0f0f1a; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .bottom-panel-tab { display: flex; align-items: center; gap: 6px; padding: 4px 12px; background: transparent; border: none; border-radius: 6px 6px 0 0; color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s; font-size: 12px; white-space: nowrap; }
    .bottom-panel-tab:hover { background: rgba(255,255,255,0.1); color: white; }
    .bottom-panel-tab.active { background: rgba(102, 126, 234, 0.3); color: #667eea; font-weight: 600; }
    .tab-icon { font-size: 13px; line-height: 1; }
    .tab-label { white-space: nowrap; }
    .tab-content { display: flex; align-items: center; gap: 16px; width: 100%; }
    .tab-content .panel-text { padding-top: 0; }
    .metrics-content, .events-content, .info-content, .connection-content { justify-content: center; }
    .overview-content { justify-content: space-between; }
    .panel-main { display: flex; justify-content: space-between; align-items: center; height: 30px; padding: 0 16px; cursor: pointer; }
    .panel-left { display: flex; align-items: center; gap: 8px; }
    .panel-right { display: flex; align-items: center; gap: 8px; }
    .panel-text { color: rgba(255,255,255,0.8); font-size: 12px; white-space: nowrap; padding-top: 2px; }
    .panel-content { display: flex; align-items: center; justify-content: center; min-height: 56px; padding: 8px 20px; opacity: 0; visibility: hidden; transition: opacity 0.2s, visibility 0.2s; }
    .top-panel:not(.collapsed) .panel-content { opacity: 1; visibility: visible; min-height: 42px; padding: 10px 20px 4px; }
    .bottom-panel:not(.collapsed) .panel-content { opacity: 1; visibility: visible; min-height: 30px; padding: 0 20px; }
    .panel-content-inner { display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 1200px; gap: 12px; }
    .panel-status { color: #4ade80; font-size: 12px; }
    .panel-status.connected { color: #4ade80; }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  readonly globalErrorService = inject(GlobalErrorService);
  private readonly logger = getLogger('app.component');
  private readonly eventBus: EventBusViewModel<Record<string, unknown>>;
  private readonly windowState: WindowStateViewModel;

  searchQuery = signal('');
  sidebarCollapsed = signal(false);
  bottomPanelCollapsed = signal(true);
  activeBottomTab = signal<string>('overview');
  windowEntries = signal<WindowEntry[]>([]);
  
  wsConnectionState = signal('connecting');
  wsDetailsExpanded = signal(false);
  wsPort = signal<string | null>(null);
  wsLatency = signal(0);
  wsUptime = signal(0);
  wsReconnects = signal(0);
  wsPingSuccess = signal(100);
  wsTotalCalls = signal(0);
  wsSuccessfulCalls = signal(0);
  wsLastError = signal<string | null>(null);

  // Window positioning constants
  private readonly WINDOW_TITLEBAR_HEIGHT = 30; // WinBox title bar height
  private readonly WINDOW_BOTTOM_PADDING = 20; // Padding from bottom edge
  private readonly WINDOW_SIDE_PADDING = 0; // No side padding - use full width
  
  bottomPanelTabs: BottomPanelTab[] = [
    { id: 'overview', label: 'Overview', icon: '📊', content: 'System overview' },
    { id: 'metrics', label: 'Metrics', icon: '📈', content: 'Performance metrics' },
    { id: 'connection', label: 'Connection', icon: '🔗', content: 'Connection stats' },
    { id: 'events', label: 'Events', icon: '🔔', content: 'Recent events' },
    { id: 'info', label: 'Info', icon: 'ℹ️', content: 'Application info' }
  ];

  private existingBoxes: any[] = [];
  private appReadyUnsubscribe: (() => void) | null = null;
  private windowIdByCardId = new Map<number, string>();
  private resizeHandler: (() => void) | null = null;

  cards: Card[] = [
    { id: 1, title: 'Angular', description: 'A platform for building mobile and desktop web applications with TypeScript.', icon: '🅰️', color: '#dd0031', content: '<h2>Angular</h2><p>Angular is a platform and framework for building single-page client applications using HTML and TypeScript.</p>' },
    { id: 2, title: 'Rsbuild', description: 'A high-performance build tool based on Rspack, written in Rust.', icon: '🚀', color: '#4776e6', content: '<h2>Rsbuild</h2><p>Rsbuild is a high-performance build tool powered by Rspack.</p>' },
    { id: 3, title: 'Bun', description: 'All-in-one JavaScript runtime, package manager, and build tool.', icon: '🟡', color: '#fbf0df', content: '<h2>Bun</h2><p>Bun is an all-in-one JavaScript runtime designed to be fast.</p>' },
    { id: 4, title: 'TypeScript', description: 'Typed superset of JavaScript that compiles to plain JavaScript.', icon: '🔷', color: '#3178c6', content: '<h2>TypeScript</h2><p>TypeScript is a strongly typed programming language.</p>' },
    { id: 5, title: 'WebUI', description: 'Build modern web-based desktop applications using web technologies.', icon: '🖥️', color: '#764ba2', content: '<h2>WebUI</h2><p>WebUI allows you to build desktop applications using web technologies.</p>' },
    { id: 6, title: 'esbuild', description: 'An extremely fast JavaScript bundler written in Go.', icon: '📦', color: '#ffcd00', content: '<h2>esbuild</h2><p>esbuild is an extremely fast JavaScript bundler written in Go.</p>' },
    { id: 7, title: 'Vite', description: 'Next generation frontend tooling with instant server start.', icon: '⚡', color: '#646cff', content: '<h2>Vite</h2><p>Vite is a build tool that aims to provide a faster development experience.</p>' },
    { id: 8, title: 'React', description: 'A JavaScript library for building user interfaces.', icon: '⚛️', color: '#61dafb', content: '<h2>React</h2><p>React is a JavaScript library for building user interfaces.</p>' },
    { id: 9, title: 'Vue', description: 'Progressive JavaScript framework for building UIs.', icon: '💚', color: '#42b883', content: '<h2>Vue</h2><p>Vue is a progressive JavaScript framework.</p>' },
    { id: 10, title: 'Svelte', description: 'Cybernetically enhanced web apps with compiler approach.', icon: '🔥', color: '#ff3e00', content: '<h2>Svelte</h2><p>Svelte represents a radical new approach to building user interfaces.</p>' },
    { id: 11, title: 'Rust', description: 'Fast, reliable, and memory-safe systems programming language.', icon: '🦀', color: '#dea584', content: '<h2>Rust</h2><p>Rust is a systems programming language focused on safety.</p>' },
    { id: 12, title: 'Tailwind CSS', description: 'A utility-first CSS framework for rapid UI development.', icon: '💨', color: '#06b6d4', content: '<h2>Tailwind CSS</h2><p>Tailwind CSS is a utility-first CSS framework.</p>' },
  ];

  filteredCards = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.cards;
    return this.cards.filter(card => `${card.title} ${card.description}`.toLowerCase().includes(query));
  });

  constructor() {
    const debugWindow = window as unknown as { __FRONTEND_EVENT_BUS__?: EventBusViewModel<Record<string, unknown>> };
    this.eventBus = debugWindow.__FRONTEND_EVENT_BUS__ ?? new EventBusViewModel<Record<string, unknown>>();
    this.windowState = new WindowStateViewModel();
  }

  private fuzzyMatch(text: string, query: string): boolean {
    let queryIndex = 0;
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) queryIndex++;
    }
    return queryIndex === query.length;
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.eventBus.publish('search:updated', { query: value, length: value.length });
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.eventBus.publish('search:cleared', { timestamp: Date.now() });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
    this.eventBus.publish('ui:top-panel:toggled', { collapsed: this.sidebarCollapsed() });
    // Wait for CSS transition (300ms) + small buffer to ensure DOM is updated
    setTimeout(() => this.resizeAllWindows(), 320);
  }

  toggleBottomPanel(): void {
    this.bottomPanelCollapsed.set(!this.bottomPanelCollapsed());
    this.eventBus.publish('ui:bottom-panel:toggled', { collapsed: this.bottomPanelCollapsed() });
    // Wait for CSS transition (300ms) + small buffer to ensure DOM is updated
    setTimeout(() => this.resizeAllWindows(), 320);
  }

  selectBottomTab(tabId: string, event: Event): void {
    event.stopPropagation();
    this.activeBottomTab.set(tabId);
    if (this.bottomPanelCollapsed()) this.bottomPanelCollapsed.set(false);
    this.eventBus.publish('ui:bottom-panel:tab-changed', { tabId });
    // Wait for CSS transition (300ms) + small buffer to ensure DOM is updated
    setTimeout(() => this.resizeAllWindows(), 320);
  }

  getCurrentTabInfo(): string {
    const tab = this.bottomPanelTabs.find(t => t.id === this.activeBottomTab());
    return tab ? tab.content : '';
  }

  toggleWsDetails(): void {
    this.wsDetailsExpanded.set(!this.wsDetailsExpanded());
    if (!this.wsDetailsExpanded()) {
      this.bottomPanelCollapsed.set(true);
    } else {
      this.bottomPanelCollapsed.set(false);
    }
  }

  formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  private initWebSocketMonitor(): void {
    this.wsConnectionState.set('connected');
    
    if (typeof window !== 'undefined') {
      window.addEventListener('webui:status', ((event: CustomEvent) => {
        const detail = event.detail;
        if (detail?.state) {
          this.wsConnectionState.set(detail.state);
        }
        if (detail?.detail?.port) {
          this.wsPort.set(String(detail.detail.port));
        }
        if (detail?.detail?.error) {
          this.wsLastError.set(detail.detail.error);
        }
      }) as EventListener);
    }
  }

  minimizedWindowCount(): number {
    return this.windowEntries().filter(entry => entry.minimized).length;
  }

  ngOnInit(): void {
    this.windowState.init();
    this.initWebSocketMonitor();
    this.appReadyUnsubscribe = this.eventBus.subscribe('app:ready', (payload: unknown) => {
      const p = payload as { timestamp: number };
      this.logger.info('Received app ready event', { timestamp: p.timestamp });
    }, { replayLast: true });
    this.closeAllBoxes();
    if (!window.WinBox) {
      window.WinBox = WinBox;
      this.logger.warn('WinBox was missing on window and has been assigned');
    }
    
    // Listen for window resize events
    if (typeof window !== 'undefined') {
      this.resizeHandler = () => this.resizeAllWindows();
      window.addEventListener('resize', this.resizeHandler);
    }
    
    this.logger.info('App component initialized', { cardsCount: this.cards.length });
  }

  ngOnDestroy(): void {
    this.appReadyUnsubscribe?.();
    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  closeAllBoxes(): void {
    this.existingBoxes.forEach(box => { if (box) box.close(); });
    this.existingBoxes = [];
    this.windowEntries.set([]);
    this.windowIdByCardId.clear();
  }

  openCard(card: Card): void {
    const existingWindowId = this.windowIdByCardId.get(card.id);
    if (existingWindowId) {
      const existingBox = this.existingBoxes.find((box: any) => box?.__windowId === existingWindowId);
      if (existingBox) {
        if (existingBox.min) existingBox.restore();
        existingBox.focus();
        this.applyMaximizedState(existingBox);
        this.markWindowFocused(existingWindowId);
        this.eventBus.publish('window:refocused', { id: existingWindowId, title: card.title });
        return;
      }
    }

    this.logger.info('Opening technology card', { id: card.id, title: card.title });
    const windowId = `card-${card.id}`;
    const windowRect = this.getAvailableWindowRect();

    const box = new WinBox({
      id: windowId,
      title: `${card.icon} ${card.title}`,
      background: card.color,
      border: 0,
      radius: 8,
      width: windowRect.width + 'px',
      height: windowRect.height + 'px',
      x: windowRect.left + 'px',
      y: windowRect.top + 'px',
      html: `<div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; height: calc(100% - 40px); overflow: auto; box-sizing: border-box; background: #fafafa;">${card.content}</div>`,
      controls: { minimize: true, maximize: true, close: true },
      onfocus: () => this.markWindowFocused(windowId),
      onblur: () => this.windowState.sendStateChange(windowId, 'blurred', card.title),
      onminimize: () => this.markWindowMinimized(windowId),
      onmaximize: () => {
        (box as any).__isMaximized = true;
        this.applyMaximizedState(box);
        this.windowState.sendStateChange(windowId, 'maximized', card.title);
      },
      onrestore: () => {
        (box as any).__isMaximized = false;
        const rect = this.getAvailableWindowRect();
        box.resize(rect.width + 'px', rect.height + 'px');
        box.move(rect.top + 'px', rect.left + 'px');
        this.markWindowRestored(windowId);
        this.windowState.sendStateChange(windowId, 'restored', card.title);
      },
      onclose: () => {
        const index = this.existingBoxes.indexOf(box);
        if (index > -1) this.existingBoxes.splice(index, 1);
        this.windowIdByCardId.delete(card.id);
        this.eventBus.publish('window:closed', { id: windowId, title: card.title });
        this.windowState.sendStateChange(windowId, 'closed', card.title);
        this.windowEntries.update(entries => entries.filter(entry => entry.id !== windowId));
        return true;
      }
    });

    (box as any).__windowId = windowId;
    (box as any).__cardTitle = card.title;
    (box as any).__cardId = card.id;
    (box as any).__isMaximized = true; // Start maximized by default
    this.existingBoxes.push(box);
    this.windowIdByCardId.set(card.id, windowId);
    this.windowEntries.update(entries => [...entries.map(e => ({ ...e, focused: false })), { id: windowId, title: card.title, minimized: false, focused: true }]);
    this.eventBus.publish('window:opened', { id: windowId, title: card.title });
    this.windowState.sendStateChange(windowId, 'focused', card.title);

    // Apply maximized state (window starts maximized)
    this.applyMaximizedState(box);
  }

  private applyMaximizedState(box: any): void {
    // Use setTimeout to ensure WinBox's native maximize completes first
    setTimeout(() => {
      const rect = this.getAvailableWindowRect();
      try {
        box.resize(rect.width + 'px', rect.height + 'px');
        box.move(rect.top + 'px', rect.left + 'px');
      } catch {
        // Ignore resize errors
      }
    }, 10);
  }

  activateWindow(windowId: string, event: Event): void {
    event.stopPropagation();
    const box = this.existingBoxes.find((entry: any) => entry?.__windowId === windowId);
    if (!box) { this.windowEntries.update(entries => entries.filter(entry => entry.id !== windowId)); return; }
    if (box.min) box.restore();
    box.focus();
    // Apply maximized state if window was maximized
    if ((box as any).__isMaximized) {
      this.applyMaximizedState(box);
    }
    this.eventBus.publish('window:focused', { id: windowId });
  }

  showMainMenu(event: Event): void {
    event.stopPropagation();
    this.existingBoxes.forEach(box => { if (box && !box.min) box.minimize(true); });
    this.windowEntries.update(entries => entries.map(entry => ({ ...entry, minimized: true, focused: false })));
    this.eventBus.publish('window:home-selected', { count: this.existingBoxes.length });
  }

  hasFocusedWindow(): boolean {
    return this.windowEntries().some(entry => entry.focused);
  }

  private markWindowFocused(windowId: string): void {
    this.eventBus.publish('window:focused', { id: windowId });
    this.windowEntries.update(entries => entries.map(entry => ({ ...entry, focused: entry.id === windowId, minimized: entry.id === windowId ? false : entry.minimized })));
    this.windowState.sendStateChange(windowId, 'focused', this.getWindowTitle(windowId));
  }

  private markWindowMinimized(windowId: string): void {
    this.eventBus.publish('window:minimized', { id: windowId });
    this.windowEntries.update(entries => entries.map(entry => entry.id === windowId ? { ...entry, minimized: true, focused: false } : entry));
    this.windowState.sendStateChange(windowId, 'minimized', this.getWindowTitle(windowId));
  }

  private markWindowRestored(windowId: string): void {
    this.eventBus.publish('window:restored', { id: windowId });
    this.windowEntries.update(entries => entries.map(entry => entry.id === windowId ? { ...entry, minimized: false } : entry));
    this.windowState.sendStateChange(windowId, 'restored', this.getWindowTitle(windowId));
  }

  private getWindowTitle(windowId: string): string {
    const entry = this.windowEntries().find(e => e.id === windowId);
    return entry?.title ?? 'Unknown';
  }

  private getTopPanelElement(): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    return document.querySelector('.top-panel') as HTMLElement | null;
  }

  private getBottomPanelElement(): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    return document.querySelector('.bottom-panel') as HTMLElement | null;
  }

  private getTopPanelHeight(): number {
    const panel = this.getTopPanelElement();
    return panel ? panel.offsetHeight : 72;
  }

  private getBottomPanelHeight(): number {
    const panel = this.getBottomPanelElement();
    return panel ? panel.offsetHeight : 88;
  }

  private getAvailableWindowHeight(): number {
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
    const topHeight = this.getTopPanelHeight();
    const bottomHeight = this.getBottomPanelHeight();
    const availableHeight = viewportHeight - topHeight - bottomHeight - this.WINDOW_BOTTOM_PADDING;
    return Math.max(200, availableHeight); // Minimum height of 200px
  }

  private getAvailableWindowRect(): { top: number; height: number; width: number; left: number } {
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const topHeight = this.getTopPanelHeight();
    const bottomHeight = this.getBottomPanelHeight();
    
    return {
      top: topHeight, // Title bar sits directly below top panel
      height: this.getAvailableWindowHeight(),
      width: viewportWidth - (2 * this.WINDOW_SIDE_PADDING),
      left: this.WINDOW_SIDE_PADDING
    };
  }

  private resizeAllWindows(): void {
    const rect = this.getAvailableWindowRect();
    this.existingBoxes.forEach((box: any) => {
      if (box && !box.min) {
        try {
          // Always apply the current available rect (respects panel heights)
          box.resize(rect.width + 'px', rect.height + 'px');
          box.move(rect.top + 'px', rect.left + 'px');
        } catch {
          // Ignore resize errors
        }
      }
    });
  }
}
