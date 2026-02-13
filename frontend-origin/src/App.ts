// App.ts
// Main application class for the vanilla TypeScript frontend

import './styles/index.css';
import { loadWinBox, isWinBoxReady, createWindow } from './lib/winbox-manager';
import type { WinBox } from './types/winbox';
import { logger as Logger } from './shared/utils/logger';

interface WindowInfo {
  id: string;
  title: string;
  minimized: boolean;
  maximized?: boolean;
  winboxInstance: WinBox;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface DbStats {
  users: number;
  tables: string[];
}



export default class App {
  private activeWindows: WindowInfo[] = [];
  private dbUsers: User[] = [];
  private dbStats: DbStats = { users: 0, tables: [] };
  private isLoadingUsers: boolean = false;
  private winboxLoadError: string | null = null;

  constructor() {
    this.setupGlobalFunctions();
  }

  async init(): Promise<void> {
    try {
      await loadWinBox();
    } catch (error) {
      this.winboxLoadError = error instanceof Error ? error.message : 'Failed to load WinBox';
      console.error('WinBox load error:', this.winboxLoadError);
    }



    Logger.info('Application initialized');

    this.setupEventListeners(Logger);
    this.render();

    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }

  private setupGlobalFunctions(): void {
    window.refreshUsers = () => {
      Logger.info('Refreshing users from database');
      this.isLoadingUsers = true;
      if (window.getUsers) {
        window.getUsers();
      }
    };

    window.searchUsers = () => {
      const searchInput = document.getElementById('db-search') as HTMLInputElement;
      const searchTerm = searchInput?.value.toLowerCase() || '';
      Logger.info('Searching users', { term: searchTerm });

      const tableBody = document.getElementById('users-table-body');
      if (tableBody) {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row) => {
          const text = row.textContent?.toLowerCase() || '';
          (row as HTMLElement).style.display = text.includes(searchTerm) ? '' : 'none';
        });
      }
    };
  }

  private setupEventListeners(logger: typeof Logger): void {
    window.addEventListener('db_response', ((event: CustomEvent) => {
      const response = event.detail;
      if (response.success) {
        this.dbUsers = response.data || [];
        logger.info('Users loaded from database', { count: this.dbUsers.length });
        this.updateSQLiteTable();
      } else {
        logger.error('Failed to load users', { error: response.error });
      }
      this.isLoadingUsers = false;
    }) as EventListener);

    window.addEventListener('stats_response', ((event: CustomEvent) => {
      const response = event.detail;
      if (response.success) {
        this.dbStats = response.stats;
        logger.info('Database stats loaded', response.stats);
      }
    }) as EventListener);
  }

  private render(): void {
    const appContainer = document.querySelector('.app') || this.createAppContainer();

    const sidebar = this.createSidebar();
    const mainContent = this.createMainContent();

    appContainer.innerHTML = '';
    appContainer.appendChild(sidebar);
    appContainer.appendChild(mainContent);
  }

  private createAppContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'app';
    document.body.appendChild(container);
    return container;
  }

  private createSidebar(): HTMLElement {
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';

    const homeButtonContainer = document.createElement('div');
    homeButtonContainer.className = 'home-button-container';
    homeButtonContainer.innerHTML = `
      <button class="home-btn" title="Show Main View">
        <span class="home-icon">🏠</span>
        <span class="home-text">Home</span>
      </button>
    `;
    const homeBtn = homeButtonContainer.querySelector('.home-btn');
    if (homeBtn) {
      homeBtn.addEventListener('click', this.hideAllWindows.bind(this));
    }

    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'sidebar-header';
    sidebarHeader.innerHTML = `
      <h2>Windows</h2>
      <span class="window-count">${this.activeWindows.length}</span>
    `;

    const windowList = document.createElement('div');
    windowList.className = 'window-list';

    if (this.activeWindows.length > 0) {
      this.activeWindows.forEach((window) => {
        const windowItem = document.createElement('div');
        windowItem.className = `window-item ${window.minimized ? 'minimized' : ''}`;
        windowItem.innerHTML = `
          <div class="window-icon">📷</div>
          <div class="window-info">
            <span class="window-title">${window.title}</span>
            <span class="window-status">${window.minimized ? 'Minimized' : 'Active'}</span>
          </div>
          <button class="window-close" title="Close window">×</button>
        `;

        windowItem.addEventListener('click', () => this.toggleWindow(window));
        const closeButton = windowItem.querySelector('.window-close');
        if (closeButton) {
          closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeWindow(window);
          });
        }

        windowList.appendChild(windowItem);
      });
    } else {
      const noWindowsDiv = document.createElement('div');
      noWindowsDiv.className = 'no-windows';
      noWindowsDiv.textContent = 'No open windows';
      windowList.appendChild(noWindowsDiv);
    }

    const sidebarFooter = document.createElement('div');
    sidebarFooter.className = 'sidebar-footer';
    if (this.activeWindows.length > 0) {
      sidebarFooter.innerHTML = `
        <button class="close-all-btn">Close All</button>
      `;
      const closeAllBtn = sidebarFooter.querySelector('.close-all-btn');
      if (closeAllBtn) {
        closeAllBtn.addEventListener('click', this.closeAllWindows.bind(this));
      }
    }

    sidebar.appendChild(homeButtonContainer);
    sidebar.appendChild(sidebarHeader);
    sidebar.appendChild(windowList);
    sidebar.appendChild(sidebarFooter);

    return sidebar;
  }

  private createMainContent(): HTMLElement {
    const mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';

    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = '<h1>System Dashboard</h1>';

    const mainContent = document.createElement('main');
    mainContent.className = 'main-content';

    const cardsSection = document.createElement('section');
    cardsSection.className = 'cards-section';

    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'cards-grid two-cards';

    const systemInfoCard = document.createElement('div');
    systemInfoCard.className = 'card feature-card';
    systemInfoCard.innerHTML = `
      <div class="card-icon">💻</div>
      <div class="card-content">
        <h3 class="card-title">System Information</h3>
        <p class="card-description">View detailed system information including OS, memory, CPU, and runtime statistics.</p>
        <div class="card-tags">
          <span class="tag">Hardware</span>
          <span class="tag">Stats</span>
        </div>
      </div>
    `;
    systemInfoCard.addEventListener('click', this.openSystemInfoWindow.bind(this));

    const sqliteCard = document.createElement('div');
    sqliteCard.className = 'card feature-card';
    sqliteCard.innerHTML = `
      <div class="card-icon">🗄️</div>
      <div class="card-content">
        <h3 class="card-title">SQLite Database</h3>
        <p class="card-description">Interactive database viewer with sample data. Connects to backend SQLite integration.</p>
        <div class="card-tags">
          <span class="tag">Database</span>
          <span class="tag">Mockup</span>
        </div>
      </div>
    `;
    sqliteCard.addEventListener('click', this.openSQLiteWindow.bind(this));

    cardsGrid.appendChild(systemInfoCard);
    cardsGrid.appendChild(sqliteCard);
    cardsSection.appendChild(cardsGrid);

    mainContent.appendChild(cardsSection);
    mainContainer.appendChild(header);
    mainContainer.appendChild(mainContent);

    return mainContainer;
  }

  private generateSystemInfoHTML(): string {
    const now = new Date();
    return `
      <div class="window-content">
        <h2>💻 System Information</h2>

        <div class="window-section">
          <h3>Operating System</h3>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Platform:</span>
              <span class="info-value">${navigator.platform}</span>
            </div>
            <div class="info-row">
              <span class="info-label">User Agent:</span>
              <span class="info-value truncate">${navigator.userAgent}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Language:</span>
              <span class="info-value">${navigator.language}</span>
            </div>
          </div>
        </div>

        <div class="window-section">
          <h3>Display & Screen</h3>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Screen Resolution:</span>
              <span class="info-value">${screen.width} × ${screen.height}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Available Resolution:</span>
              <span class="info-value">${screen.availWidth} × ${screen.availHeight}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Color Depth:</span>
              <span class="info-value">${screen.colorDepth}-bit</span>
            </div>
            <div class="info-row">
              <span class="info-label">Pixel Ratio:</span>
              <span class="info-value">${window.devicePixelRatio}x</span>
            </div>
          </div>
        </div>

        <div class="window-section">
          <h3>Browser Information</h3>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Online Status:</span>
              <span class="info-value status-indicator ${navigator.onLine ? 'online' : 'offline'}">${navigator.onLine ? '● Online' : '● Offline'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Cookies Enabled:</span>
              <span class="info-value">${navigator.cookieEnabled ? 'Yes' : 'No'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Cores:</span>
              <span class="info-value">${navigator.hardwareConcurrency || 'Unknown'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Memory:</span>
              <span class="info-value">${(navigator as { deviceMemory?: number }).deviceMemory || 'Unknown'} GB</span>
            </div>
          </div>
        </div>

        <div class="window-section">
          <h3>Current Time</h3>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Local Time:</span>
              <span class="info-value">${now.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Timezone:</span>
              <span class="info-value">${Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Timezone Offset:</span>
              <span class="info-value">UTC${now.getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(now.getTimezoneOffset() / 60)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private generateSQLiteHTML(): string {
    const users = this.dbUsers.length > 0 ? this.dbUsers : [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
      { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Editor', status: 'Active' },
      { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'User', status: 'Pending' },
    ];

    const rows = users.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.name}</td>
        <td>${row.email}</td>
        <td><span class="role-badge ${row.role.toLowerCase()}">${row.role}</span></td>
        <td><span class="status-badge ${row.status.toLowerCase()}">● ${row.status}</span></td>
      </tr>
    `).join('');

    return `
      <div class="window-content">
        <div class="toolbar">
          <div class="toolbar-left">
            <h2>🗄️ SQLite Database</h2>
            <span class="live-badge">Live Data</span>
          </div>
        </div>

        <div class="window-section">
          <div class="search-box">
            <input type="text" id="db-search" class="search-input" placeholder="Search records...">
            <button class="btn" onclick="searchUsers()">Search</button>
            <button class="btn btn-secondary" onclick="refreshUsers()">↻</button>
          </div>
        </div>

        <div class="stats-row">
          <span>📊 Table: <strong>users</strong></span>
          <span>📋 Records: <strong>${users.length}</strong></span>
          <span>💾 Source: <strong>Rust SQLite</strong></span>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              ${rows}
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          <span>Showing ${users.length} record${users.length !== 1 ? 's' : ''}</span>
          <div class="pagination">
            <button class="pagination-btn" disabled>Previous</button>
            <button class="pagination-btn" disabled>Next</button>
          </div>
        </div>
      </div>
    `;
  }

  private openSystemInfoWindow(): void {
    this.openWindow('System Information', this.generateSystemInfoHTML(), '💻');
  }

  private openSQLiteWindow(): void {
    this.isLoadingUsers = true;
    Logger.info('Opening SQLite window, fetching users from backend...');

    if (window.getUsers) {
      Logger.info('Calling Rust backend get_users function');
      window.getUsers();
    } else {
      Logger.warn('Rust backend get_users not available');
      this.isLoadingUsers = false;
    }

    if (window.getDbStats) {
      window.getDbStats();
    }

    this.openWindow('SQLite Database', this.generateSQLiteHTML(), '🗄️');
  }

  private updateSQLiteTable(): void {
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody || this.dbUsers.length === 0) return;

    const rows = this.dbUsers.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.name}</td>
        <td>${row.email}</td>
        <td><span class="role-badge ${row.role.toLowerCase()}">${row.role}</span></td>
        <td><span class="status-badge ${row.status.toLowerCase()}">● ${row.status}</span></td>
      </tr>
    `).join('');

    tableBody.innerHTML = rows;
  }

  private openWindow(title: string, content: string, icon: string): void {
    if (!isWinBoxReady()) {
      Logger.error(`WinBox is not loaded. ${this.winboxLoadError || 'Please try again.'}`);
      return;
    }

    const existingWindow = this.activeWindows.find((w) => w.title === title);
    if (existingWindow) {
      if (existingWindow.minimized) {
        existingWindow.winboxInstance.restore();
        existingWindow.minimized = false;
      }
      existingWindow.winboxInstance.focus();
      this.updateUI();
      return;
    }

    Logger.info('Opening window', { windowTitle: title, icon });

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
      onminimize: () => {
        const windowInfo = this.activeWindows.find((w) => w.id === windowId);
        if (windowInfo) {
          windowInfo.minimized = true;
          windowInfo.maximized = false;
        }
        this.updateUI();
      },
      onrestore: () => {
        const winWidth = window.innerWidth - sidebarWidth - 40;
        const winHeight = window.innerHeight - 40;
        winbox?.resize(winWidth, winHeight);
        winbox?.move(windowX, windowY);

        const windowInfo = this.activeWindows.find((w) => w.id === windowId);
        if (windowInfo) {
          windowInfo.minimized = false;
          windowInfo.maximized = false;
        }
        this.updateUI();
      },
      onmaximize: () => {
        const winWidth = window.innerWidth - sidebarWidth - 40;
        const winHeight = window.innerHeight - 40;
        winbox?.resize(winWidth, winHeight);
        winbox?.move(windowX, windowY);

        const windowInfo = this.activeWindows.find((w) => w.id === windowId);
        if (windowInfo) {
          windowInfo.maximized = true;
          windowInfo.minimized = false;
        }
      },
      onclose: () => {
        const index = this.activeWindows.findIndex((w) => w.id === windowId);
        if (index > -1) {
          this.activeWindows.splice(index, 1);
        }
        this.updateUI();
        return true;
      },
    });

    if (!winbox) {
      Logger.error('Failed to create window');
      return;
    }

    const windowInfo: WindowInfo = {
      id: windowId,
      title: title,
      minimized: false,
      maximized: false,
      winboxInstance: winbox,
    };
    this.activeWindows.push(windowInfo);

    this.updateUI();
  }

  private toggleWindow(windowInfo: WindowInfo): void {
    if (windowInfo.minimized) {
      windowInfo.winboxInstance.restore();
      windowInfo.minimized = false;
    } else if (windowInfo.maximized) {
      windowInfo.winboxInstance.restore();
      windowInfo.maximized = false;
    } else {
      windowInfo.winboxInstance.minimize();
      windowInfo.minimized = true;
    }
    this.updateUI();
  }

  private closeWindow(windowInfo: WindowInfo): void {
    windowInfo.winboxInstance.close();
    const index = this.activeWindows.findIndex((w) => w.id === windowInfo.id);
    if (index > -1) {
      this.activeWindows.splice(index, 1);
    }
    this.updateUI();
  }

  private closeAllWindows(): void {
    this.activeWindows.forEach((windowInfo) => {
      windowInfo.winboxInstance.close();
    });
    this.activeWindows = [];
    this.updateUI();
  }

  private hideAllWindows(): void {
    this.activeWindows.forEach((windowInfo) => {
      if (!windowInfo.minimized) {
        windowInfo.winboxInstance.minimize();
        windowInfo.minimized = true;
        windowInfo.maximized = false;
      }
    });
    Logger.info('All windows minimized - showing main view');
    this.updateUI();
  }

  private handleWindowResize(): void {
    this.activeWindows.forEach((windowInfo) => {
      if (windowInfo.maximized && !windowInfo.minimized) {
        const availableWidth = window.innerWidth - 200;
        const availableHeight = window.innerHeight;
        windowInfo.winboxInstance.resize(availableWidth, availableHeight);
        windowInfo.winboxInstance.move(200, 0);
      }
    });
  }

  private updateUI(): void {
    const appContainer = document.querySelector('.app');
    if (appContainer) {
      const sidebar = this.createSidebar();
      const mainContent = this.createMainContent();

      appContainer.innerHTML = '';
      appContainer.appendChild(sidebar);
      appContainer.appendChild(mainContent);
    }
  }
}
