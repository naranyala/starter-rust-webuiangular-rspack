// frontend/src/use-cases/App.ts

// Define interfaces
interface WindowInfo {
  id: string;
  title: string;
  minimized: boolean;
  maximized?: boolean;
  winboxInstance: any;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

// Declare global window properties
declare global {
  interface Window {
    WinBox: any;
    getUsers?: () => void;
    getDbStats?: () => void;
    refreshUsers?: () => void;
    searchUsers?: () => void;
    Logger?: {
      info: (message: string, meta?: Record<string, any>) => void;
      warn: (message: string, meta?: Record<string, any>) => void;
      error: (message: string, meta?: Record<string, any>) => void;
      debug: (message: string, meta?: Record<string, any>) => void;
      sendToBackend?: (message: string, level?: string, meta?: Record<string, any>) => Promise<void> | void;
      sessionId?: string;
    };
    WebUIBridge?: {
      callRustFunction: (funcName: string, data?: any, options?: any) => Promise<any>;
      getStatus?: () => {
        state: string;
        connected: boolean;
        lastError: string | null;
        lastChange: number;
      };
    };
  }
}

// Use window.Logger or create a fallback
const Logger = window.Logger || {
  info: (msg: string, meta?: any) => console.log('[INFO]', msg, meta),
  warn: (msg: string, meta?: any) => console.warn('[WARN]', msg, meta),
  error: (msg: string, meta?: any) => console.error('[ERROR]', msg, meta),
  debug: (msg: string, meta?: any) => console.debug('[DEBUG]', msg, meta),
};

function getFrontendSessionId(): string {
  return window.Logger?.sessionId || 'frontend';
}

function sendWindowEvent(eventType: string, windowId: string, title: string, state: { minimized?: boolean; maximized?: boolean } = {}): void {
  const message = "WinBox " + eventType + ": " + title;
  const payload = {
    message: message.replace(/\s+/g, " ").trim(),
    level: "INFO",
    meta: {
      event: eventType,
      window_id: windowId,
      title,
      minimized: state.minimized ?? false,
      maximized: state.maximized ?? false,
      timestamp: new Date().toISOString()
    },
    category: "winbox",
    session_id: getFrontendSessionId(),
    frontend_timestamp: new Date().toISOString()
  };

  if (window.WebUIBridge?.callRustFunction) {
    window.WebUIBridge.callRustFunction("log_message", payload).catch(() => {});
    return;
  }

  if (window.Logger?.sendToBackend) {
    window.Logger.sendToBackend(payload.message, payload.level, payload.meta);
  }
}


function getWindowState(windowId: string): { minimized?: boolean; maximized?: boolean } {
  const windowInfo = activeWindows.find(w => w.id === windowId);
  if (!windowInfo) {
    return {};
  }
  return {
    minimized: windowInfo.minimized,
    maximized: windowInfo.maximized
  };
}


let wsStatusBar: HTMLElement | null = null;
let wsStatusButtons: HTMLElement | null = null;
let wsStatusToggle: HTMLButtonElement | null = null;
let wsStatusCollapsed = true;

function ensureWebuiStatusBar(): void {
  if (wsStatusBar) return;
  const existing = document.getElementById('bottom-panel');
  if (existing) {
    wsStatusBar = existing;
    wsStatusButtons = existing.querySelector('.panel-buttons') as HTMLElement | null;
    wsStatusToggle = existing.querySelector('.panel-toggle') as HTMLButtonElement | null;
    return;
  }

  wsStatusBar = document.createElement('div');
  wsStatusBar.id = 'bottom-panel';
  wsStatusBar.classList.add('connecting', 'panel-collapsed');

  const statusText = document.createElement('div');
  statusText.className = 'panel-status-text';
  statusText.textContent = 'WebUI: connecting';

  wsStatusButtons = document.createElement('div');
  wsStatusButtons.className = 'panel-buttons';
  wsStatusButtons.id = 'bottom-panel-buttons';

  wsStatusToggle = document.createElement('button');
  wsStatusToggle.className = 'panel-toggle';
  wsStatusToggle.textContent = 'Expand';
  wsStatusToggle.type = 'button';
  wsStatusToggle.addEventListener('click', () => {
    wsStatusCollapsed = !wsStatusCollapsed;
    if (!wsStatusBar) return;
    wsStatusBar.classList.toggle('panel-collapsed', wsStatusCollapsed);
    wsStatusBar.classList.toggle('panel-expanded', !wsStatusCollapsed);
    if (wsStatusToggle) {
      wsStatusToggle.textContent = wsStatusCollapsed ? 'Expand' : 'Collapse';
    }
  });

  wsStatusBar.appendChild(statusText);
  wsStatusBar.appendChild(wsStatusButtons);
  wsStatusBar.appendChild(wsStatusToggle);
  document.body.appendChild(wsStatusBar);
}

function updateWebuiStatusBar(state: string, detail: any = {}): void {
  ensureWebuiStatusBar();
  if (!wsStatusBar) return;

  wsStatusBar.className = state + (wsStatusCollapsed ? ' panel-collapsed' : ' panel-expanded');
  const textEl = wsStatusBar.querySelector('.panel-status-text');
  if (!textEl) return;

  let suffix = '';
  if (detail?.port) {
    suffix += ` :${detail.port}`;
  }
  if (detail?.error) {
    suffix += ' - ' + detail.error;
  } else if (detail?.reason) {
    suffix += ' - ' + detail.reason;
  }

  textEl.textContent = `WebUI: ${state}${suffix}`;
}

function registerBottomPanelButtons(buttons: Array<{ label: string; action: () => void }>): void {
  ensureWebuiStatusBar();
  if (!wsStatusButtons) return;

  wsStatusButtons.innerHTML = '';

  const errorButtons = buttons.filter(b => /error|rejection|network/i.test(b.label));
  const otherButtons = buttons.filter(b => !/error|rejection|network/i.test(b.label));

  const addButton = (btn: { label: string; action: () => void }) => {
    const button = document.createElement('button');
    button.textContent = btn.label;
    button.className = 'panel-button';
    button.onclick = btn.action;
    wsStatusButtons?.appendChild(button);
  };

  errorButtons.forEach(addButton);

  if (errorButtons.length && otherButtons.length) {
    const divider = document.createElement('div');
    divider.className = 'panel-divider';
    wsStatusButtons?.appendChild(divider);
  }

  otherButtons.forEach(addButton);
}


// Application state
let activeWindows: WindowInfo[] = [];
let dbUsers: User[] = [];
let dbStats = { users: 0, tables: [] as string[] };
let isLoadingUsers = false;

// DOM Elements references
let sidebarElement: HTMLElement | null = null;
let mainContainerElement: HTMLElement | null = null;
let windowListElement: HTMLElement | null = null;

// Initialize the application
export default function App(): void {
  Logger.info('Application initialized');  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
}

function initializeApp(): void {
  // Find required DOM elements
  sidebarElement = document.querySelector('.sidebar');
  mainContainerElement = document.querySelector('.main-container');
  windowListElement = document.querySelector('.window-list');
  
  if (!sidebarElement || !mainContainerElement) {
    console.error('Required DOM elements not found');
    return;
  }
  
  // Set up event listeners
  setupEventListeners();
  
  // Set up global functions
  setupGlobalFunctions();
  (window as any).registerBottomPanelButtons = registerBottomPanelButtons;
  
  // Add resize listener
  window.addEventListener('resize', handleWindowResize);
  
  // WebUI connection status bar
  ensureWebuiStatusBar();
  const initialStatus = window.WebUIBridge?.getStatus?.();
  if (initialStatus?.state) {
    updateWebuiStatusBar(initialStatus.state, {
      error: initialStatus.lastError
    });
  }
  window.addEventListener('webui:status', (event: Event) => {
    const detail = (event as CustomEvent).detail || {};
    updateWebuiStatusBar(detail.state || 'unknown', detail.detail || {});
  });
  window.addEventListener('webui:port', (event: Event) => {
    const detail = (event as CustomEvent).detail || {};
    const state = window.WebUIBridge?.getStatus?.()?.state || 'unknown';
    updateWebuiStatusBar(state, { port: detail.port });
  });
  
  Logger.info('App initialized successfully');
}

function setupEventListeners(): void {
  // Home button
  const homeButton = document.querySelector('.home-btn');
  if (homeButton) {
    homeButton.addEventListener('click', hideAllWindows);
  }
  
  // Feature cards
  const systemCard = document.querySelector('.feature-card:first-child');
  const dbCard = document.querySelector('.feature-card:nth-child(2)');
  
  if (systemCard) {
    systemCard.addEventListener('click', openSystemInfoWindow);
  }
  
  if (dbCard) {
    dbCard.addEventListener('click', openSQLiteWindow);
  }
  
  // Close all windows button
  const closeAllButton = document.querySelector('.close-all-btn');
  if (closeAllButton) {
    closeAllButton.addEventListener('click', closeAllWindows);
  }
  
  // Listen for database responses
  window.addEventListener('db_response', handleDbResponse);
  window.addEventListener('stats_response', handleStatsResponse);
}

function setupGlobalFunctions(): void {
  window.refreshUsers = () => {
    Logger.info('Refreshing users from database');
    isLoadingUsers = true;
    updateLoadingState();
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
      rows.forEach((row: any) => {
        const text = row.textContent?.toLowerCase() || '';
        row.style.display = text.includes(searchTerm) ? '' : 'none';
      });
    }
  };
}

function handleDbResponse(event: Event): void {
  const customEvent = event as CustomEvent;
  const response = customEvent.detail;
  if (response.success) {
    dbUsers = response.data || [];
    Logger.info('Users loaded from database', { count: response.data?.length || 0 });
    updateSQLiteTable();
  } else {
    Logger.error('Failed to load users', { error: response.error });
  }
  isLoadingUsers = false;
  updateLoadingState();
}

function handleStatsResponse(event: Event): void {
  const customEvent = event as CustomEvent;
  const response = customEvent.detail;
  if (response.success) {
    dbStats = response.stats;
    Logger.info('Database stats loaded', response.stats);
  }
}

function updateLoadingState(): void {
  // Update UI based on loading state if needed
  const sqliteWindow = activeWindows.find(w => w.title === 'SQLite Database');
  if (sqliteWindow && sqliteWindow.winboxInstance && sqliteWindow.winboxInstance.body) {
    const loadingIndicator = sqliteWindow.winboxInstance.body.querySelector('#loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = isLoadingUsers ? 'block' : 'none';
    }
  }
}

function generateSystemInfoHTML(): string {
  const now = new Date();
  return `
    <div style="padding: 20px; color: white; font-family: 'Segoe UI', sans-serif; max-height: 100%; overflow-y: auto;">
      <h2 style="margin-bottom: 20px; color: #4f46e5;">💻 System Information</h2>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 10px;">Operating System</h3>
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Platform:</span>
            <span>${navigator.platform}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">User Agent:</span>
            <span style="font-size: 0.8rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${navigator.userAgent}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Language:</span>
            <span>${navigator.language}</span>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 10px;">Display & Screen</h3>
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Screen Resolution:</span>
            <span>${screen.width} × ${screen.height}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Available Resolution:</span>
            <span>${screen.availWidth} × ${screen.availHeight}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Color Depth:</span>
            <span>${screen.colorDepth}-bit</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Pixel Ratio:</span>
            <span>${window.devicePixelRatio}x</span>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 10px;">Browser Information</h3>
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Online Status:</span>
            <span style="color: ${navigator.onLine ? '#10b981' : '#ef4444'}">${navigator.onLine ? '🟢 Online' : '🔴 Offline'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Cookies Enabled:</span>
            <span>${navigator.cookieEnabled ? 'Yes' : 'No'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Cores:</span>
            <span>${navigator.hardwareConcurrency || 'Unknown'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Memory:</span>
            <span>${navigator.deviceMemory || 'Unknown'} GB</span>
          </div>
        </div>
      </div>

      <div>
        <h3 style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 10px;">Current Time</h3>
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Local Time:</span>
            <span>${now.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Timezone:</span>
            <span>${Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Timezone Offset:</span>
            <span>UTC${now.getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(now.getTimezoneOffset() / 60)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateSQLiteHTML(): string {
  const users = dbUsers.length > 0 ? dbUsers : [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', created_at: '' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active', created_at: '' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive', created_at: '' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Editor', status: 'Active', created_at: '' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'User', status: 'Pending', created_at: '' },
  ];

  const rows = users.map((row: User) => `
    <tr style="border-bottom: 1px solid #334155;">
      <td style="padding: 10px; color: #e2e8f0;">${row.id}</td>
      <td style="padding: 10px; color: #e2e8f0;">${row.name}</td>
      <td style="padding: 10px; color: #94a3b8;">${row.email}</td>
      <td style="padding: 10px;"><span style="background: ${row.role === 'Admin' ? '#dc2626' : row.role === 'Editor' ? '#f59e0b' : '#3b82f6'}; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${row.role}</span></td>
      <td style="padding: 10px;"><span style="color: ${row.status === 'Active' ? '#10b981' : row.status === 'Inactive' ? '#ef4444' : '#f59e0b'}">● ${row.status}</span></td>
    </tr>
  `).join('');

  return `
    <div style="padding: 20px; color: white; font-family: 'Segoe UI', sans-serif; height: 100%; display: flex; flex-direction: column;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="color: #4f46e5;">🗄️ SQLite Database Viewer</h2>
        <span style="background: #10b981; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem;">Live Data</span>
      </div>

      <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <input type="text" id="db-search" placeholder="Search records..." style="flex: 1; padding: 8px 12px; background: rgba(0,0,0,0.3); border: 1px solid #334155; border-radius: 6px; color: white; font-size: 0.9rem;">
          <button onclick="searchUsers()" style="padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">Search</button>
          <button onclick="refreshUsers()" style="padding: 8px 16px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">↻</button>
        </div>

        <div style="display: flex; gap: 15px; font-size: 0.8rem; color: #94a3b8;">
          <span>📊 Table: <strong style="color: white;">users</strong></span>
          <span>📋 Records: <strong style="color: white;">${users.length}</strong></span>
          <span>💾 Source: <strong style="color: white;">Rust SQLite</strong></span>
        </div>
      </div>

      <div style="flex: 1; overflow: auto; background: rgba(0,0,0,0.2); border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background: rgba(255,255,255,0.1); position: sticky; top: 0;">
            <tr>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">ID</th>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">Name</th>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">Email</th>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">Role</th>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">Status</th>
            </tr>
          </thead>
          <tbody id="users-table-body">
            ${rows}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #64748b; font-size: 0.8rem;">Showing ${users.length} record${users.length !== 1 ? 's' : ''}</span>
        <div style="display: flex; gap: 5px;">
          <button style="padding: 5px 12px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;" disabled>Previous</button>
          <button style="padding: 5px 12px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;" disabled>Next</button>
        </div>
      </div>
    </div>
  `;
}

function openSystemInfoWindow(): void {
  openWindow('System Information', generateSystemInfoHTML(), '💻');
}

function openSQLiteWindow(): void {
  isLoadingUsers = true;
  updateLoadingState();
  Logger.info('Opening SQLite window, fetching users from backend...');

  if (window.getUsers) {
    Logger.info('Calling Rust backend get_users function');
    window.getUsers();
  } else {
    Logger.warn('Rust backend get_users not available');
    isLoadingUsers = false;
    updateLoadingState();
  }

  if (window.getDbStats) {
    window.getDbStats();
  }

  openWindow('SQLite Database', generateSQLiteHTML(), '🗄️');
}

function updateSQLiteTable(): void {
  const tableBody = document.getElementById('users-table-body');
  if (!tableBody || dbUsers.length === 0) return;

  const rows = dbUsers.map((row: User) => `
    <tr style="border-bottom: 1px solid #334155;">
      <td style="padding: 10px; color: #e2e8f0;">${row.id}</td>
      <td style="padding: 10px; color: #e2e8f0;">${row.name}</td>
      <td style="padding: 10px; color: #94a3b8;">${row.email}</td>
      <td style="padding: 10px;"><span style="background: ${row.role === 'Admin' ? '#dc2626' : row.role === 'Editor' ? '#f59e0b' : '#3b82f6'}; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${row.role}</span></td>
      <td style="padding: 10px;"><span style="color: ${row.status === 'Active' ? '#10b981' : row.status === 'Inactive' ? '#ef4444' : '#f59e0b'}">● ${row.status}</span></td>
    </tr>
  `).join('');

  tableBody.innerHTML = rows;
}

function openWindow(title: string, content: string, icon: string): void {
  if (!window.WinBox) {
    Logger.error('WinBox is not loaded yet. Please try again in a moment.');
    return;
  }

  const existingWindow = activeWindows.find(w => w.title === title);
  if (existingWindow) {
    if (existingWindow.minimized) {
      existingWindow.winboxInstance.restore();
      existingWindow.minimized = false;
    }
    existingWindow.winboxInstance.focus();
    updateWindowListUI();
    return;
  }

  Logger.info('Opening window', { windowTitle: title });

  const windowId = 'win-' + Date.now();
  let winboxInstance: any;

  winboxInstance = new window.WinBox({
    title: title,
    background: '#1e293b',
    border: 4,
    width: 'calc(100% - 200px)',
    height: '100%',
    x: '200px',
    y: '0',
    minwidth: '300px',
    minheight: '300px',
    max: true,
    min: true,
    mount: document.createElement('div'),
    oncreate: function() {
      this.body.innerHTML = content;
      sendWindowEvent('open', windowId, title, { minimized: false, maximized: false });
    },
    onfocus: function() {
      sendWindowEvent('focus', windowId, title, getWindowState(windowId));
    },
    onblur: function() {
      sendWindowEvent('blur', windowId, title, getWindowState(windowId));
    },
    onminimize: function() {
      activeWindows = activeWindows.map(w =>
        w.id === windowId ? { ...w, minimized: true } : w
      );
      updateWindowListUI();
      sendWindowEvent('minimize', windowId, title, { minimized: true, maximized: false });
    },
    onrestore: function() {
      activeWindows = activeWindows.map(w =>
        w.id === windowId ? { ...w, minimized: false, maximized: false } : w
      );
      updateWindowListUI();
      sendWindowEvent('restore', windowId, title, { minimized: false, maximized: false });
    },
    onmaximize: function() {
      const availableWidth = window.innerWidth - 200;
      const availableHeight = window.innerHeight;

      this.resize(availableWidth, availableHeight);
      this.move(200, 0);

      activeWindows = activeWindows.map(w =>
        w.id === windowId ? { ...w, maximized: true } : w
      );
      updateWindowListUI();
      sendWindowEvent('maximize', windowId, title, { minimized: false, maximized: true });
    },
    onclose: function() {
      sendWindowEvent('close', windowId, title, getWindowState(windowId));
      activeWindows = activeWindows.filter(w => w.id !== windowId);
      updateWindowListUI();
    }
  });

  const windowInfo: WindowInfo = {
    id: windowId,
    title: title,
    minimized: false,
    maximized: false,
    winboxInstance: winboxInstance
  };

  activeWindows = [...activeWindows, windowInfo];
  updateWindowListUI();
}

function focusWindow(windowInfo: WindowInfo): void {
  if (windowInfo.minimized) {
    windowInfo.winboxInstance.restore();
    activeWindows = activeWindows.map(w =>
      w.id === windowInfo.id ? { ...w, minimized: false } : w
    );
    updateWindowListUI();
  }
  windowInfo.winboxInstance.focus();
}

function closeWindow(windowInfo: WindowInfo): void {
  windowInfo.winboxInstance.close();
  activeWindows = activeWindows.filter(w => w.id !== windowInfo.id);
  updateWindowListUI();
}

function closeAllWindows(): void {
  activeWindows.forEach(windowInfo => {
    windowInfo.winboxInstance.close();
  });
  activeWindows = [];
  updateWindowListUI();
}

function hideAllWindows(): void {
  activeWindows.forEach(windowInfo => {
    if (!windowInfo.minimized) {
      windowInfo.winboxInstance.minimize();
    }
  });
  activeWindows = activeWindows.map(w => ({ ...w, minimized: true, maximized: false }));
  updateWindowListUI();
  Logger.info('All windows minimized - showing main view');
}

function handleWindowResize(): void {
  activeWindows.forEach(windowInfo => {
    if (windowInfo.maximized && !windowInfo.minimized) {
      const availableWidth = window.innerWidth - 200;
      const availableHeight = window.innerHeight;

      windowInfo.winboxInstance.resize(availableWidth, availableHeight);
      windowInfo.winboxInstance.move(200, 0);
    }
  });
}

function updateWindowListUI(): void {
  if (!windowListElement) return;
  
  // Clear the window list
  windowListElement.innerHTML = '';
  
  // Add each window to the list
  activeWindows.forEach((windowInfo) => {
    const windowItem = document.createElement('div');
    windowItem.className = `window-item ${windowInfo.minimized ? 'minimized' : ''}`;
    windowItem.innerHTML = `
      <div class="window-icon">📷</div>
      <div class="window-info">
        <span class="window-title">${windowInfo.title}</span>
        <span class="window-status">${windowInfo.minimized ? 'Minimized' : 'Active'}</span>
      </div>
      <button class="window-close" title="Close window">×</button>
    `;
    
    // Add click handlers
    windowItem.addEventListener('click', () => focusWindow(windowInfo));
    const closeButton = windowItem.querySelector('.window-close');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        closeWindow(windowInfo);
      });
    }
    
    windowListElement!.appendChild(windowItem);
  });
  
  // Show "No open windows" message if needed
  if (activeWindows.length === 0) {
    const noWindowsDiv = document.createElement('div');
    noWindowsDiv.className = 'no-windows';
    noWindowsDiv.textContent = 'No open windows';
    windowListElement.appendChild(noWindowsDiv);
  }
  
  // Update window count
  const windowCountElement = document.querySelector('.window-count');
  if (windowCountElement) {
    windowCountElement.textContent = activeWindows.length.toString();
  }
  
  // Show/hide close all button
  const closeAllButton = document.querySelector('.close-all-btn');
  if (closeAllButton) {
    closeAllButton.parentElement!.style.display = activeWindows.length > 0 ? 'block' : 'none';
  }
}