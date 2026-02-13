// WinBox type definitions for the window management library
// Based on: https://github.com/nextapps-de/winbox

export interface WinBoxConstructor {
  new (options: WinBoxOptions): WinBox;
}

export interface WinBox {
  id: string;
  dom: DocumentFragment & { firstChild: HTMLElement };
  body: HTMLElement;
  title: HTMLElement;
  group: WinBoxGroup | null;

  setBackground(color: string): this;
  setTitle(title: string): this;
  show(): this;
  hide(): this;
  close(): this;
  minimize(): this;
  restore(): this;
  maximize(): this;
  fullscreen(): this;
  focus(): this;
  blur(): this;
  setWidth(width: number | string, animate?: boolean): this;
  setHeight(height: number | string, animate?: boolean): this;
  setSize(width: number | string, height: number | string, animate?: boolean): this;
  setMinWidth(minWidth: number | string): this;
  setMinHeight(minHeight: number | string): this;
  setMinSize(minWidth: number | string, minHeight: number | string): this;
  setMaxWidth(maxWidth: number | string): this;
  setMaxHeight(maxHeight: number | string): this;
  setMaxSize(maxWidth: number | string, maxHeight: number | string): this;
  setX(x: number | string, animate?: boolean): this;
  setY(y: number | string, animate?: boolean): this;
  setPosition(x: number | string, y: number | string, animate?: boolean): this;
  top(): this;
  minimize(): this;
  addClass(className: string): this;
  removeClass(className: string): this;
  toggleClass(className: string, state?: boolean): this;

  on(event: 'move' | 'resize' | 'close' | 'blur' | 'focus' | 'show' | 'hide' | 'minimize' | 'restore' | 'maximize' | 'fullscreen' | 'mount' | 'unmount', callback: (this: this, winbox: this) => void): this;
  on(event: string, callback: (this: this, winbox: this) => void): this;

  // Properties
  readonly hidden: boolean;
  readonly minimized: boolean;
  readonly maximized: boolean;
  readonly fullscreened: boolean;
}

export interface WinBoxOptions {
  id?: string;
  title: string;
  url?: string;
  html?: string;
  mount?: HTMLElement | DocumentFragment;
  background?: string;
  border?: number;
  height?: number | string;
  width?: number | string;
  minheight?: number | string;
  minwidth?: number | string;
  maxheight?: number | string;
  maxwidth?: number | string;
  x?: number | string;
  y?: number | string;
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
  modal?: boolean;
  index?: number;
  center?: boolean;
  onclose?: (this: WinBox, winbox: WinBox) => boolean | void;
  onblur?: (this: WinBox, winbox: WinBox) => void;
  onfocus?: (this: WinBox, winbox: WinBox) => void;
  onmove?: (this: WinBox, winbox: WinBox) => void;
  onresize?: (this: WinBox, winbox: WinBox) => void;
  onminimize?: (this: WinBox, winbox: WinBox) => void;
  onrestore?: (this: WinBox, winbox: WinBox) => void;
  onmaximize?: (this: WinBox, winbox: WinBox) => void;
  onfullscreen?: (this: WinBox, winbox: WinBox) => void;
  oncreate?: (this: WinBox, winbox: WinBox) => void;
  onmount?: (this: WinBox, winbox: WinBox) => void;
  onunmount?: (this: WinBox, winbox: WinBox) => void;
}

export interface WinBoxGroup {
  winbox: WinBox;
  windows: WinBox[];
  active: WinBox | null;
}

declare global {
  interface Window {
    WinBox: WinBoxConstructor;
  }
}
