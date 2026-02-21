import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { WinBoxInstance } from '../../core/winbox.service';
import { WinBoxService } from '../../core/winbox.service';
import type { CardItem } from '../../models';
import { EventBusViewModel } from '../../viewmodels/event-bus.viewmodel';
import { getLogger } from '../../viewmodels/logger.viewmodel';
import { WindowStateViewModel } from '../../viewmodels/window-state.viewmodel';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="demo-container">
      <h1>Technology Cards</h1>
      <p class="subtitle">Explore the technologies powering this demo</p>

      <div class="search-container">
        <input
          type="text"
          class="search-input"
          placeholder="Search technologies..."
          [(ngModel)]="searchQuery"
        />
        <span class="search-icon">🔍</span>
        @if (searchQuery) {
          <button type="button" class="clear-btn" (click)="searchQuery = ''">×</button>
        }
      </div>

      <div class="cards-grid">
        @for (card of filteredCards; track card.title) {
          <div class="card" (click)="openCard(card)">
            <div class="card-icon" [style.background]="card.color">
              {{ card.icon }}
            </div>
            <h3 class="card-title">{{ card.title }}</h3>
            <p class="card-description">{{ card.description }}</p>
            <span class="click-hint">Click to learn more</span>
          </div>
        } @empty {
          <div class="no-results">
            <p>No results found for "{{ searchQuery }}"</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
    .demo-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .demo-container h1 {
      font-size: 2rem;
      color: #1a1a2e;
      margin-bottom: 8px;
      text-align: center;
    }

    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 32px;
    }

    .search-container {
      position: relative;
      max-width: 500px;
      margin: 0 auto 40px;
    }

    .search-input {
      width: 100%;
      padding: 14px 45px 14px 20px;
      font-size: 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }

    .search-input:focus {
      border-color: #0f3460;
      box-shadow: 0 0 0 3px rgba(15, 52, 96, 0.1);
    }

    .search-icon {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.2rem;
      opacity: 0.5;
    }

    .clear-btn {
      position: absolute;
      right: 45px;
      top: 50%;
      transform: translateY(-50%);
      background: #e0e0e0;
      border: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      color: #666;
      transition: background 0.2s;
    }

    .clear-btn:hover {
      background: #ccc;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s, box-shadow 0.2s, cursor 0.2s;
      animation: fadeIn 0.3s ease-out;
      cursor: pointer;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .card:active {
      transform: translateY(-2px);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .card-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 16px;
    }

    .card-title {
      font-size: 1.25rem;
      color: #1a1a2e;
      margin: 0 0 12px;
    }

    .card-description {
      color: #666;
      line-height: 1.6;
      margin: 0;
      font-size: 0.95rem;
    }

    .no-results {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }

    .click-hint {
      display: inline-block;
      margin-top: 12px;
      padding: 4px 12px;
      background: #f0f4ff;
      color: #0f3460;
      font-size: 0.85rem;
      border-radius: 20px;
      opacity: 0.8;
      transition: opacity 0.2s;
    }

    .card:hover .click-hint {
      opacity: 1;
    }

    @media (max-width: 600px) {
      .cards-grid { grid-template-columns: 1fr; }
      .demo-container h1 { font-size: 1.5rem; }
    }
  `,
  ],
})
export class DemoComponent {
  private readonly logger = getLogger('demo.component');
  searchQuery = '';
  private existingWindows = new Map<string, WinBoxInstance>();

  cards: CardItem[] = [
    {
      title: 'Angular',
      description:
        'A platform for building mobile and desktop web applications with TypeScript and component-based architecture.',
      icon: '🅰️',
      color: '#e535ab',
      content: `<h2>Angular</h2><p>Angular is a development platform, built on TypeScript.</p><p><strong>Version:</strong> 19.x</p>`,
      link: 'https://angular.dev',
    },
    {
      title: 'Rsbuild',
      description: 'A high-performance build tool based on Rspack.',
      icon: '⚡',
      color: '#f5a623',
      content: `<h2>Rsbuild</h2><p>Rsbuild is a high performance build tool based on Rspack.</p><p><strong>Speed:</strong> 10x faster than Webpack</p>`,
      link: 'https://rsbuild.dev',
    },
    {
      title: 'Bun',
      description: 'All-in-one JavaScript runtime and package manager.',
      icon: '🥟',
      color: '#fbf0df',
      content: `<h2>Bun</h2><p>Bun is an all-in-one toolkit for JavaScript and TypeScript apps.</p><p><strong>Speed:</strong> 3x faster than Node.js</p>`,
      link: 'https://bun.sh',
    },
    {
      title: 'TypeScript',
      description: 'Typed superset of JavaScript that compiles to plain JavaScript.',
      icon: '📘',
      color: '#3178c6',
      content: `<h2>TypeScript</h2><p>TypeScript is a strongly typed programming language.</p><p><strong>Version:</strong> 5.x</p>`,
      link: 'https://typescriptlang.org',
    },
    {
      title: 'esbuild',
      description: 'An extremely fast JavaScript bundler and minifier.',
      icon: '🚀',
      color: '#ffcf00',
      content: `<h2>esbuild</h2><p>esbuild is an extremely fast JavaScript bundler.</p><p><strong>Speed:</strong> Up to 100x faster</p>`,
      link: 'https://esbuild.github.io',
    },
    {
      title: 'HMR',
      description: 'Hot Module Replacement for instant updates.',
      icon: '🔥',
      color: '#ff6b6b',
      content: `<h2>HMR</h2><p>HMR exchanges modules while application is running.</p>`,
    },
  ];

  constructor(
    private readonly winboxService: WinBoxService,
    private readonly eventBus: EventBusViewModel<Record<string, unknown>>,
    private readonly windowState: WindowStateViewModel
  ) {}

  get filteredCards(): CardItem[] {
    if (!this.searchQuery.trim()) {
      return this.cards;
    }
    const query = this.searchQuery.toLowerCase().trim();
    return this.cards.filter(
      card =>
        card.title.toLowerCase().includes(query) || card.description.toLowerCase().includes(query)
    );
  }

  openCard(card: CardItem): void {
    const windowId = `demo-${card.title}`;

    const existingWindow = this.existingWindows.get(card.title);
    if (existingWindow) {
      if (existingWindow.min) existingWindow.restore();
      existingWindow.focus();
      existingWindow.maximize();
      this.windowState.sendStateChange(windowId, 'focused', card.title);
      this.eventBus.publish('window:refocused', { id: windowId, title: card.title });
      return;
    }

    // Create window using WinBoxService - start maximized
    const box = this.winboxService.create({
      title: card.title,
      background: card.color,
      width: '600px',
      height: '500px',
      x: 'center',
      y: 'center',
      max: true,
      html: `<div style="padding: 20px; color: #333; height: 100%; overflow: auto; background: white;">${card.content}</div>`,
      onfocus: function (this: WinBoxInstance) {
        this.setBackground(card.color);
      },
      onclose: () => {
        this.existingWindows.delete(card.title);
        this.windowState.sendStateChange(windowId, 'closed', card.title);
        return true;
      },
    });

    if (!box) {
      this.logger.error('Failed to create WinBox window', { cardTitle: card.title });
      return;
    }

    this.existingWindows.set(card.title, box);

    // WinBoxService creates windows already maximized when max: true
    this.windowState.sendStateChange(windowId, 'focused', card.title);
    this.eventBus.publish('window:opened', { id: windowId, title: card.title });
  }
}
