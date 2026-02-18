import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare const WinBox: any;

interface Card {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  content: string;
}

interface SidebarItem {
  id: string;
  icon: string;
  label: string;
  active?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-container" [class.sidebar-collapsed]="sidebarCollapsed()" [class.bottom-panel-collapsed]="bottomPanelCollapsed()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="logo">⚡</span>
          @if (!sidebarCollapsed()) {
            <span class="logo-text">TechHub</span>
          }
        </div>
        
        <nav class="sidebar-nav">
          @for (item of sidebarItems; track item.id) {
            <button 
              class="nav-item" 
              [class.active]="item.active"
              (click)="selectNavItem(item)"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              @if (!sidebarCollapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </button>
          }
        </nav>

        <div class="sidebar-footer">
          <button class="toggle-btn" (click)="toggleSidebar()">
            <span class="toggle-icon">{{ sidebarCollapsed() ? '→' : '←' }}</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="search-container">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="search-input"
            placeholder="Fuzzy search technologies..."
            [value]="searchQuery()"
            (input)="onSearch($event)"
          />
          @if (searchQuery()) {
            <button type="button" class="clear-btn" (click)="clearSearch()">✕</button>
          }
        </div>

        <div class="cards-grid">
          @for (card of filteredCards(); track card.id) {
            <article class="card" [style.border-left-color]="card.color" (click)="openCard(card)">
              <div class="card-icon" [style.background]="card.color">{{ card.icon }}</div>
              <h3 class="card-title">{{ card.title }}</h3>
              <p class="card-description">{{ card.description }}</p>
              <span class="click-hint">Click to open</span>
            </article>
          } @empty {
            <div class="no-results">
              <span class="no-results-icon">🔎</span>
              <p>No matching cards for "{{ searchQuery() }}"</p>
            </div>
          }
        </div>
      </main>

      <!-- Bottom Panel -->
      <div class="bottom-panel" [class.collapsed]="bottomPanelCollapsed()">
        <div class="panel-main">
          <div class="panel-left">
            <span class="panel-text">⚡ TechHub v1.0.0</span>
          </div>
          <div class="panel-toggle" (click)="toggleBottomPanel()">
            <span class="panel-toggle-icon">{{ bottomPanelCollapsed() ? '▲' : '▼' }}</span>
            <span class="panel-toggle-text">System Info</span>
          </div>
          <div class="panel-right">
            <span class="panel-text">12 technologies</span>
          </div>
        </div>
        <div class="panel-content">
          <div class="panel-content-inner">
            <span class="panel-text">WebUI (GTK/WebKit)</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    /* Sidebar */
    .sidebar {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 60px;
      width: 220px;
      background: #1a1a2e;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s ease;
      z-index: 100;
    }
    .sidebar-header {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .logo {
      font-size: 24px;
    }
    .logo-text {
      font-size: 18px;
      font-weight: bold;
      color: white;
    }
    .sidebar-nav {
      flex: 1;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: transparent;
      border: none;
      border-radius: 8px;
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      font-size: 14px;
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }
    .nav-item.active {
      background: #667eea;
      color: white;
    }
    .nav-icon {
      font-size: 18px;
      width: 24px;
      text-align: center;
    }
    .nav-label {
      white-space: nowrap;
    }
    .sidebar-footer {
      padding: 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .toggle-btn {
      width: 100%;
      padding: 10px;
      background: rgba(255,255,255,0.1);
      border: none;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
    }
    .toggle-btn:hover {
      background: rgba(255,255,255,0.2);
    }
    
    /* Collapsed sidebar */
    .sidebar-collapsed .sidebar {
      transform: translateX(-160px);
    }
    
    /* Main Content */
    .main-content {
      flex: 1;
      margin-left: 220px;
      margin-bottom: 60px;
      overflow-y: auto;
      padding: 40px 20px;
      background: #f5f5f5;
      transition: margin-left 0.3s ease, margin-bottom 0.3s ease;
    }
    .sidebar-collapsed .main-content {
      margin-left: 60px;
    }
    .bottom-panel-collapsed .main-content {
      margin-bottom: 32px;
    }
    .bottom-panel-collapsed .sidebar {
      bottom: 32px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    h1 {
      color: #1a1a2e;
      margin: 0 0 8px;
      font-size: 32px;
    }
    .subtitle {
      color: #666;
      margin: 0;
      font-size: 16px;
    }
    .search-container {
      position: relative;
      max-width: 500px;
      margin: 0 auto 16px;
    }
    .search-input {
      width: 100%;
      padding: 14px 44px 14px 44px;
      font-size: 16px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }
    .search-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
      opacity: 0.5;
    }
    .clear-btn {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: #e0e0e0;
      border: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .clear-btn:hover {
      background: #ccc;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      border-left: 4px solid;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
      position: relative;
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-bottom: 16px;
    }
    .card-title {
      margin: 0 0 8px;
      font-size: 18px;
      color: #333;
    }
    .card-description {
      margin: 0;
      color: #666;
      line-height: 1.5;
      font-size: 14px;
    }
    .click-hint {
      position: absolute;
      bottom: 12px;
      right: 16px;
      font-size: 12px;
      color: #999;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .card:hover .click-hint {
      opacity: 1;
    }
    .no-results {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      color: #888;
    }
    .no-results-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    /* Bottom Panel */
    .bottom-panel {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 32px;
      background: #1a1a2e;
      transition: height 0.3s ease;
      z-index: 200;
    }
    .bottom-panel.collapsed {
      height: 32px;
    }
    .bottom-panel:not(.collapsed) {
      height: 60px;
    }
    .panel-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 32px;
      padding: 0 16px;
    }
    .panel-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .panel-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .panel-text {
      color: rgba(255,255,255,0.8);
      font-size: 12px;
      white-space: nowrap;
    }
    .panel-divider {
      color: rgba(255,255,255,0.3);
      font-size: 12px;
    }
    .panel-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      cursor: pointer;
      color: rgba(255,255,255,0.7);
      transition: color 0.2s;
      border-radius: 4px;
    }
    .panel-toggle:hover {
      color: white;
      background: rgba(255,255,255,0.1);
    }
    .panel-toggle-icon {
      font-size: 10px;
    }
    .panel-toggle-text {
      font-size: 11px;
      font-weight: 500;
    }
    .panel-content {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      padding: 0 20px;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
    }
    .bottom-panel:not(.collapsed) .panel-content {
      opacity: 1;
      visibility: visible;
    }
    .panel-content-inner {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .panel-status {
      color: #4ade80;
      font-size: 12px;
    }
  `]
})
export class AppComponent implements OnInit {
  searchQuery = signal('');
  sidebarCollapsed = signal(false);
  bottomPanelCollapsed = signal(true);
  private existingBoxes: any[] = [];

  sidebarItems: SidebarItem[] = [
    { id: 'home', icon: '🏠', label: 'Home', active: true },
    { id: 'cards', icon: '🎴', label: 'Cards' },
    { id: 'favorites', icon: '⭐', label: 'Favorites' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  cards: Card[] = [
    {
      id: 1,
      title: 'Angular',
      description: 'A platform for building mobile and desktop web applications with TypeScript.',
      icon: '🅰️',
      color: '#dd0031',
      content: `
        <h2>Angular</h2>
        <p>Angular is a platform and framework for building single-page client applications using HTML and TypeScript.</p>
        <h3>Key Features:</h3>
        <ul>
          <li>Component-based architecture</li>
          <li>TypeScript-based</li>
          <li>Powerful CLI</li>
          <li>Dependency injection</li>
          <li>Two-way data binding</li>
        </ul>
        <p>Developed by Google, Angular is used by many enterprise applications worldwide.</p>
      `
    },
    {
      id: 2,
      title: 'Rsbuild',
      description: 'A high-performance build tool based on Rspack, written in Rust.',
      icon: '🚀',
      color: '#4776e6',
      content: `
        <h2>Rsbuild</h2>
        <p>Rsbuild is a high-performance build tool powered by Rspack, written in Rust.</p>
        <h3>Key Features:</h3>
        <ul>
          <li>Lightning-fast cold start</li>
          <li>HMR with native ESM</li>
          <li>Framework-agnostic</li>
          <li>Compatible with webpack plugins</li>
          <li>TypeScript support out of the box</li>
        </ul>
      `
    },
    {
      id: 3,
      title: 'Bun',
      description: 'All-in-one JavaScript runtime, package manager, and build tool.',
      icon: '🟡',
      color: '#fbf0df',
      content: `
        <h2>Bun</h2>
        <p>Bun is an all-in-one JavaScript runtime designed to be fast and feature-complete.</p>
        <h3>Key Features:</h3>
        <ul>
          <li>Incredibly fast (3x faster than Node.js)</li>
          <li>Native package manager</li>
          <li>Built-in bundler</li>
          <li>Native TypeScript support</li>
          <li>Web APIs compatibility</li>
        </ul>
      `
    },
    {
      id: 4,
      title: 'TypeScript',
      description: 'Typed superset of JavaScript that compiles to plain JavaScript.',
      icon: '🔷',
      color: '#3178c6',
      content: `
        <h2>TypeScript</h2>
        <p>TypeScript is a strongly typed programming language that builds on JavaScript.</p>
        <h3>Key Features:</h3>
        <ul>
          <li>Static type checking</li>
          <li>IDE support</li>
          <li>Object-oriented features</li>
          <li>ES6+ compatibility</li>
          <li>Great tooling</li>
        </ul>
      `
    },
    {
      id: 5,
      title: 'WebUI',
      description: 'Build modern web-based desktop applications using web technologies.',
      icon: '🖥️',
      color: '#764ba2',
      content: `
        <h2>WebUI</h2>
        <p>WebUI allows you to build desktop applications using web technologies and Rust.</p>
        <h3>Key Features:</h3>
        <ul>
          <li>Lightweight (~2MB)</li>
          <li>Multi-window support</li>
          <li>Custom title bar</li>
          <li>JavaScript/Rust bridge</li>
          <li>Cross-platform</li>
        </ul>
      `
    },
    {
      id: 6,
      title: 'esbuild',
      description: 'An extremely fast JavaScript bundler written in Go.',
      icon: '📦',
      color: '#ffcd00',
      content: `
        <h2>esbuild</h2>
        <p>esbuild is an extremely fast JavaScript bundler written in Go.</p>
        <h3>Key Features:</h3>
        <ul>
          <li>10-100x faster than other bundlers</li>
          <li>Native TypeScript support</li>
          <li>MJS/CJS compatibility</li>
          <li>Minification built-in</li>
          <li>Watch mode</li>
        </ul>
      `
    },
    {
      id: 7,
      title: 'Vite',
      description: 'Next generation frontend tooling with instant server start.',
      icon: '⚡',
      color: '#646cff',
      content: `
        <h2>Vite</h2>
        <p>Vite is a build tool that aims to provide a faster and leaner development experience.</p>
        <h3>Key Features:</h3>
        <ul>
          <li>Instant server start</li>
          <li>Lightning fast HMR</li>
          <li>Native ESM</li>
          <li>Optimized builds</li>
          <li>Universal plugins</li>
        </ul>
      `
    },
    {
      id: 8,
      title: 'React',
      description: 'A JavaScript library for building user interfaces.',
      icon: '⚛️',
      color: '#61dafb',
      content: `
        <h2>React</h2>
        <p>React is a JavaScript library for building user interfaces, maintained by Meta.</p>
        <h3>Key Features:</h3>
        <ul>
          <li>Virtual DOM</li>
          <li>Component-based</li>
          <li>JSX syntax</li>
          <li>One-way data binding</li>
          <li>Huge ecosystem</li>
        </ul>
      `
    },
    {
      id: 9,
      title: 'Vue',
      description: 'Progressive JavaScript framework for building UIs.',
      icon: '💚',
      color: '#42b883',
      content: `
        <h2>Vue</h2>
        <p>Vue is a progressive JavaScript framework for building user interfaces.</p>
        <h3>Key Features:</h3>
        <ul>
          <li>Reactive data binding</li>
          <li>Component system</li>
          <li>Directives</li>
          <li>Computed properties</li>
          <li>Single-file components</li>
        </ul>
      `
    },
    {
      id: 10,
      title: 'Svelte',
      description: 'Cybernetically enhanced web apps with compiler approach.',
      icon: '🔥',
      color: '#ff3e00',
      content: `
        <h2>Svelte</h2>
        <p>Svelte represents a radical new approach to building user interfaces.</p>
        <h3>Key Features:</h3>
        <ul>
          <li>No virtual DOM</li>
          <li>Truly reactive</li>
          <li>Less code</li>
          <li>Compiler-based</li>
          <li>Small bundle size</li>
        </ul>
      `
    },
    {
      id: 11,
      title: 'Rust',
      description: 'Fast, reliable, and memory-safe systems programming language.',
      icon: '🦀',
      color: '#dea584',
      content: `
        <h2>Rust</h2>
        <p>Rust is a systems programming language focused on safety and performance.</p>
        <h3>Key Features:</h3>
        <ul>
          <li>Memory safety</li>
          <li>Zero-cost abstractions</li>
          <li>Fearless concurrency</li>
          <li>Pattern matching</li>
          <li>Great tooling (Cargo)</li>
        </ul>
      `
    },
    {
      id: 12,
      title: 'Tailwind CSS',
      description: 'A utility-first CSS framework for rapid UI development.',
      icon: '💨',
      color: '#06b6d4',
      content: `
        <h2>Tailwind CSS</h2>
        <p>Tailwind CSS is a utility-first CSS framework for rapid UI development.</p>
        <h3>Key Features:</h3>
        <ul>
          <li>Utility-first</li>
          <li>No context switching</li>
          <li>Responsive design</li>
          <li>Component-friendly</li>
          <li>Customizable</li>
        </ul>
      `
    }
  ];

  filteredCards = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.cards;

    return this.cards.filter(card => {
      const haystack = `${card.title} ${card.description}`.toLowerCase();
      return this.fuzzyMatch(haystack, query);
    });
  });

  private fuzzyMatch(text: string, query: string): boolean {
    let queryIndex = 0;
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === query.length;
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  toggleBottomPanel(): void {
    this.bottomPanelCollapsed.set(!this.bottomPanelCollapsed());
  }

  selectNavItem(item: SidebarItem): void {
    this.sidebarItems = this.sidebarItems.map(i => ({
      ...i,
      active: i.id === item.id
    }));
  }

  ngOnInit(): void {
    this.closeAllBoxes();
    if (!window.WinBox) {
      window.WinBox = WinBox;
    }
  }

  closeAllBoxes(): void {
    this.existingBoxes.forEach(box => {
      if (box) box.close();
    });
    this.existingBoxes = [];
  }

  openCard(card: Card): void {
    this.closeAllBoxes();

    const box = new WinBox({
      title: `${card.icon} ${card.title}`,
      background: card.color,
      border: 0,
      radius: 8,
      width: '500px',
      height: '400px',
      x: 'center',
      y: 'center',
      html: `
        <div style="
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          height: calc(100% - 40px);
          overflow: auto;
          box-sizing: border-box;
          background: #fafafa;
        ">
          ${card.content}
        </div>
      `,
      controls: {
        minimize: true,
        maximize: true,
        close: true,
      },
      onmaximize: () => {
        const sidebarW = this.sidebarCollapsed() ? 60 : 220;
        box.resize(window.innerWidth - sidebarW, window.innerHeight - 32);
        box.move(sidebarW, 0);
      },
      onrestore: () => {
        box.resize('500px', '400px');
        box.move('center', 'center');
      },
      onclose: () => {
        const index = this.existingBoxes.indexOf(box);
        if (index > -1) {
          this.existingBoxes.splice(index, 1);
        }
        return true;
      }
    });

    this.existingBoxes.push(box);
  }
}
