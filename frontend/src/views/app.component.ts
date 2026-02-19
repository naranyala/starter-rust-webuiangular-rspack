import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getLogger } from '../viewmodels/logger';
import { ErrorModalComponent } from './shared/error-modal.component';
import { GlobalErrorService } from '../core/global-error.service';
import { EventBusViewModel } from '../viewmodels/event-bus.viewmodel';
import { WindowStateViewModel } from '../viewmodels/window-state.viewmodel';
import { Card, BottomPanelTab, WindowEntry, TECH_CARDS } from '../models';

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
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
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

  cards: Card[] = TECH_CARDS;

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
