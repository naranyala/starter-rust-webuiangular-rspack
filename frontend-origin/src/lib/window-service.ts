/**
 * Window Service Implementation
 */

import { IWindowService } from './services.js';
import { loadWinBox, isWinBoxReady, createWindow } from './winbox-manager.js';
import type { WinBox } from '../types/winbox.d.ts';

export class WindowService implements IWindowService {
  async openWindow(title: string, content: string, icon: string): Promise<void> {
    if (!isWinBoxReady()) {
      console.error('WinBox is not loaded');
      return;
    }

    const windowId = `win-${Date.now()}`;
    const sidebarWidth = 240;
    const windowX = sidebarWidth + 20;
    const windowY = 20;
    const windowWidth = window.innerWidth - sidebarWidth - 40;
    const windowHeight = window.innerHeight - 40;

    const winbox = createWindow({
      title: `${icon} ${title}`,
      html: content,
      background: '#1e293b',
      border: 4,
      width: windowWidth,
      height: windowHeight,
      x: windowX,
      y: windowY,
      minwidth: '300px',
      minheight: '300px',
      max: true,
      min: true,
    });

    if (!winbox) {
      console.error('Failed to create window');
      return;
    }

    // Store window reference for later use
    (window as any)[windowId] = winbox;
  }

  closeWindow(windowId: string): void {
    const winbox = (window as any)[windowId];
    if (winbox && typeof winbox.close === 'function') {
      winbox.close();
      delete (window as any)[windowId];
    }
  }

  closeAllWindows(): void {
    // Find all window references and close them
    Object.keys(window).forEach(key => {
      if (key.startsWith('win-') && typeof (window as any)[key]?.close === 'function') {
        (window as any)[key].close();
        delete (window as any)[key];
      }
    });
  }

  minimizeWindow(windowId: string): void {
    const winbox = (window as any)[windowId];
    if (winbox && typeof winbox.minimize === 'function') {
      winbox.minimize();
    }
  }

  restoreWindow(windowId: string): void {
    const winbox = (window as any)[windowId];
    if (winbox && typeof winbox.restore === 'function') {
      winbox.restore();
    }
  }
}