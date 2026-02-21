import { Injectable, signal } from '@angular/core';
import type { WindowEntry, WindowState, WindowStateEvent } from '../models';

@Injectable({
  providedIn: 'root',
})
export class WindowStateViewModel {
  private readonly windowEntries = signal<WindowEntry[]>([]);
  private readonly initialized = signal(false);

  readonly entries = this.windowEntries.asReadonly();
  readonly isInitialized = this.initialized.asReadonly();

  init(): void {
    if (this.initialized()) {
      return;
    }
    this.initialized.set(true);
  }

  getMinimizedCount(): number {
    return this.windowEntries().filter(entry => entry.minimized).length;
  }

  hasFocusedWindow(): boolean {
    return this.windowEntries().some(entry => entry.focused);
  }

  addWindow(id: string, title: string): void {
    this.windowEntries.update(entries => [
      ...entries.map(entry => ({ ...entry, focused: false })),
      { id, title, minimized: false, focused: true },
    ]);
  }

  removeWindow(id: string): void {
    this.windowEntries.update(entries => entries.filter(entry => entry.id !== id));
  }

  focusWindow(id: string): void {
    this.windowEntries.update(entries =>
      entries.map(entry => ({
        ...entry,
        focused: entry.id === id,
        minimized: entry.id === id ? false : entry.minimized,
      }))
    );
  }

  minimizeWindow(id: string): void {
    this.windowEntries.update(entries =>
      entries.map(entry =>
        entry.id === id ? { ...entry, minimized: true, focused: false } : entry
      )
    );
  }

  restoreWindow(id: string): void {
    this.windowEntries.update(entries =>
      entries.map(entry => (entry.id === id ? { ...entry, minimized: false } : entry))
    );
  }

  clearAllWindows(): void {
    this.windowEntries.set([]);
  }

  minimizeAllWindows(): void {
    this.windowEntries.update(entries =>
      entries.map(entry => ({ ...entry, minimized: true, focused: false }))
    );
  }

  sendStateChange(windowId: string, state: WindowState, title: string): void {
    const event: WindowStateEvent = {
      window_id: windowId,
      state,
      title,
      timestamp: new Date().toISOString(),
    };

    try {
      if (typeof window !== 'undefined') {
        const win = window as unknown as { window_state_change?: (data: string) => void };
        if (typeof win.window_state_change === 'function') {
          win.window_state_change(JSON.stringify(event));
        }
      }
    } catch {
      // Silently fail if WebUI is not available
    }
  }
}
