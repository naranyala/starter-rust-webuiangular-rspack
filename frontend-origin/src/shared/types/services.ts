export interface ISystemInfoService {
  getSystemInfo(): Promise<any>;
  getBrowserInfo(): any;
  getDisplayInfo(): any;
}

export interface IDbService {
  getUsers(): Promise<any>;
  getStats(): Promise<any>;
  refreshUsers(): void;
}

export interface IWindowService {
  openWindow(title: string, content: string, icon?: string): void;
  closeWindow(windowId: string): void;
  closeAllWindows(): void;
  minimizeWindow(windowId: string): void;
  restoreWindow(windowId: string): void;
}

export interface IUiService {
  updateUI(): void;
  render(): void;
  createMainContent(): HTMLElement;
  createSidebar(): HTMLElement;
}