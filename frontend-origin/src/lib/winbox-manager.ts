// winbox-manager.ts
// Wrapper module for WinBox library integration

import type { WinBox, WinBoxConstructor, WinBoxOptions } from '../types/winbox.d.ts';

let WinBoxClass: WinBoxConstructor | null = null;
let isLoaded = false;

export function loadWinBox(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isLoaded && WinBoxClass) {
      resolve();
      return;
    }

    if (typeof window.WinBox === 'undefined') {
      const script = document.createElement('script');
      script.src = './static/js/winbox.min.js';
      script.onload = () => {
        if (typeof window.WinBox !== 'undefined') {
          WinBoxClass = window.WinBox;
          isLoaded = true;
          resolve();
        } else {
          reject(new Error('WinBox library failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load WinBox library'));
      document.head.appendChild(script);
    } else {
      WinBoxClass = window.WinBox;
      isLoaded = true;
      resolve();
    }
  });
}

export function isWinBoxReady(): boolean {
  return isLoaded && WinBoxClass !== null;
}

export function createWindow(options: Omit<WinBoxOptions, 'mount'> & { mount?: HTMLElement | DocumentFragment; oncreate?: (winbox: WinBox) => void; onclose?: (winbox: WinBox) => boolean | void }): WinBox | null {
  if (!WinBoxClass) {
    console.error('WinBox is not loaded. Call loadWinBox() first.');
    return null;
  }

  const winboxOptions: WinBoxOptions = {
    ...options,
    mount: options.mount || document.createElement('div'),
    nobottom: true,
    oncreate: function(this: WinBox) {
      this.body.innerHTML = typeof options.html === 'string' ? options.html : '';
      options.oncreate?.(this);
    },
    onclose: function(this: WinBox) {
      return options.onclose?.(this) ?? true;
    },
  };

  return new WinBoxClass(winboxOptions);
}

export function createModalWindow(title: string, content: string, onClose?: () => void): WinBox | null {
  return createWindow({
    title,
    html: content,
    width: 400,
    height: 'auto',
    modal: true,
    border: 20,
    onclose: () => {
      onClose?.();
      return true;
    },
  });
}

export function showNotification(title: string, message: string, duration = 3000): WinBox | null {
  const notification = createWindow({
    title,
    html: `<div style="padding: 16px; text-align: center;">${message}</div>`,
    width: 300,
    height: 'auto',
    x: 'right',
    y: 'bottom',
    background: '#1e293b',
    border: 8,
  });

  if (notification && duration > 0) {
    setTimeout(() => {
      notification.close();
    }, duration);
  }

  return notification;
}
