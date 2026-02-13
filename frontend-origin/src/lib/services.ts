/**
 * Service interfaces and implementations for the frontend
 */

// Interface for system information service
export interface ISystemInfoService {
  getSystemInfo(): Promise<any>;
  getBrowserInfo(): any;
  getDisplayInfo(): any;
}

// Interface for database service
export interface IDbService {
  getUsers(): Promise<any>;
  getStats(): Promise<any>;
  refreshUsers(): void;
}

// Interface for window management service
export interface IWindowService {
  openWindow(title: string, content: string, icon: string): void;
  closeWindow(windowId: string): void;
  closeAllWindows(): void;
  minimizeWindow(windowId: string): void;
  restoreWindow(windowId: string): void;
}

// Interface for UI service
export interface IUiService {
  updateUI(): void;
  render(): void;
  createMainContent(): HTMLElement;
  createSidebar(): HTMLElement;
}

// Concrete implementations would go here, but for now we'll just define the interfaces