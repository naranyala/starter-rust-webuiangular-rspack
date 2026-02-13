import { IWindowService } from '../shared/types/services';

declare global {
  interface Window {
    webui?: {
      call(event: string, callback?: (response: any) => void): void;
    };
  }
}

export class WindowService implements IWindowService {
  private windows: Map<string, any> = new Map();

  openWindow(title: string, content: string, icon: string = ''): void {
    const windowId = `window_${Date.now()}`;
    const windowInfo = { title, content, icon, id: windowId };
    this.windows.set(windowId, windowInfo);
    
    if (typeof window !== 'undefined' && window.webui) {
      window.webui.call('open_window', windowInfo);
    }
  }

  closeWindow(windowId: string): void {
    this.windows.delete(windowId);
    
    if (typeof window !== 'undefined' && window.webui) {
      window.webui.call('close_window', { windowId });
    }
  }

  closeAllWindows(): void {
    const windowIds = Array.from(this.windows.keys());
    windowIds.forEach(id => {
      this.closeWindow(id);
    });
  }

  minimizeWindow(windowId: string): void {
    if (typeof window !== 'undefined' && window.webui) {
      window.webui.call('minimize_window', { windowId });
    }
  }

  restoreWindow(windowId: string): void {
    if (typeof window !== 'undefined' && window.webui) {
      window.webui.call('restore_window', { windowId });
    }
  }
}