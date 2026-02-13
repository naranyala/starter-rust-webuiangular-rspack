import { IUiService } from '../shared/types/services';

export class UiService implements IUiService {
  private mainContent: HTMLElement | null = null;
  private sidebar: HTMLElement | null = null;

  updateUI(): void {
    this.render();
  }

  render(): void {
    if (this.mainContent) {
      this.mainContent.innerHTML = this.getMainContentHTML();
    }
    if (this.sidebar) {
      this.sidebar.innerHTML = this.getSidebarHTML();
    }
  }

  createMainContent(): HTMLElement {
    this.mainContent = document.createElement('main');
    this.mainContent.className = 'main-content';
    this.mainContent.innerHTML = this.getMainContentHTML();
    return this.mainContent;
  }

  createSidebar(): HTMLElement {
    this.sidebar = document.createElement('aside');
    this.sidebar.className = 'sidebar';
    this.sidebar.innerHTML = this.getSidebarHTML();
    return this.sidebar;
  }

  private getMainContentHTML(): string {
    return `
      <div class="content-area">
        <h1>Welcome to Rust WebUI App</h1>
        <p>This is the main content area.</p>
        <div id="dynamic-content">
          <!-- Dynamic content will be loaded here -->
        </div>
      </div>
    `;
  }

  private getSidebarHTML(): string {
    return `
      <nav class="nav-menu">
        <ul>
          <li><a href="#" data-page="dashboard">Dashboard</a></li>
          <li><a href="#" data-page="users">Users</a></li>
          <li><a href="#" data-page="settings">Settings</a></li>
          <li><a href="#" data-page="system">System Info</a></li>
        </ul>
      </nav>
    `;
  }
}