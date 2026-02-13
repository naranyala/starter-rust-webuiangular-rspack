/**
 * UI Service Implementation
 */

import { IUiService } from './services.js';

export class UiService implements IUiService {
  updateUI(): void {
    // Trigger a UI update by re-rendering the main content
    const appContainer = document.querySelector('.app');
    if (appContainer) {
      // This would typically trigger a re-render of the UI
      // For now, we'll just dispatch a custom event
      window.dispatchEvent(new CustomEvent('ui-update'));
    }
  }

  render(): void {
    // This method would handle the main rendering logic
    // For now, we'll just dispatch a custom event
    window.dispatchEvent(new CustomEvent('ui-render'));
  }

  createMainContent(): HTMLElement {
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

    cardsGrid.appendChild(systemInfoCard);
    cardsGrid.appendChild(sqliteCard);
    cardsSection.appendChild(cardsGrid);

    mainContent.appendChild(cardsSection);
    mainContainer.appendChild(header);
    mainContainer.appendChild(mainContent);

    return mainContainer;
  }

  createSidebar(): HTMLElement {
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

    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'sidebar-header';
    sidebarHeader.innerHTML = `
      <h2>Windows</h2>
      <span class="window-count">0</span>
    `;

    const windowList = document.createElement('div');
    windowList.className = 'window-list';

    const noWindowsDiv = document.createElement('div');
    noWindowsDiv.className = 'no-windows';
    noWindowsDiv.textContent = 'No open windows';
    windowList.appendChild(noWindowsDiv);

    sidebar.appendChild(homeButtonContainer);
    sidebar.appendChild(sidebarHeader);
    sidebar.appendChild(windowList);

    return sidebar;
  }
}