import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface CardItem {
  title: string;
  description: string;
  icon: string;
  color: string;
  content: string;
  link?: string;
}

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
  styles: [`
    .demo-container {
      padding: 40px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 10px;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    .search-container {
      position: relative;
      max-width: 400px;
      margin: 0 auto 30px;
    }
    .search-input {
      width: 100%;
      padding: 12px 40px 12px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 25px;
      font-size: 16px;
      outline: none;
      transition: border-color 0.3s;
    }
    .search-input:focus {
      border-color: #4a90d9;
    }
    .search-icon {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
    }
    .clear-btn {
      position: absolute;
      right: 45px;
      top: 50%;
      transform: translateY(-50%);
      background: #ccc;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      color: white;
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
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    .card-icon {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-bottom: 16px;
    }
    .card-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px;
    }
    .card-description {
      font-size: 14px;
      color: #666;
      line-height: 1.5;
      margin: 0 0 12px;
    }
    .click-hint {
      font-size: 12px;
      color: #999;
    }
    .no-results {
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px;
      color: #666;
    }
  `],
})
export class DemoComponent {
  searchQuery = '';

  cards: CardItem[] = [
    {
      title: 'Angular',
      description: 'A platform for building mobile and desktop web applications with TypeScript.',
      icon: '🅰️',
      color: '#e535ab',
      content: `
        <h2>Angular</h2>
        <p>Angular is a development platform, built on TypeScript.</p>
        <ul>
          <li>Component-based framework</li>
          <li>Integrated libraries for routing, forms</li>
          <li>Developer tools suite</li>
        </ul>
        <p><strong>Version:</strong> 19.x</p>
      `,
      link: 'https://angular.dev',
    },
    {
      title: 'Rspack',
      description: 'A high-performance JavaScript bundler written in Rust.',
      icon: '⚡',
      color: '#f5a623',
      content: `
        <h2>Rspack</h2>
        <p>Lightning fast bundler with Webpack compatibility.</p>
        <ul>
          <li>10x faster cold starts</li>
          <li>Incremental compilation</li>
          <li>Built-in loaders</li>
        </ul>
      `,
      link: 'https://rspack.dev',
    },
    {
      title: 'Bun',
      description: 'An all-in-one JavaScript runtime, package manager, and build tool.',
      icon: '🥟',
      color: '#fbf0df',
      content: `
        <h2>Bun</h2>
        <p>Fast all-in-one JavaScript toolkit.</p>
        <ul>
          <li>3x faster than Node.js</li>
          <li>Built-in package manager</li>
          <li>Test runner included</li>
        </ul>
      `,
      link: 'https://bun.sh',
    },
    {
      title: 'TypeScript',
      description: 'A typed superset of JavaScript that compiles to plain JavaScript.',
      icon: '📘',
      color: '#3178c6',
      content: `
        <h2>TypeScript</h2>
        <p>JavaScript with static types.</p>
        <ul>
          <li>Static type checking</li>
          <li>Enhanced IDE support</li>
          <li>Compiles to clean JS</li>
        </ul>
      `,
      link: 'https://typescriptlang.org',
    },
    {
      title: 'esbuild',
      description: 'An extremely fast JavaScript bundler and minifier.',
      icon: '🚀',
      color: '#ffcf00',
      content: `
        <h2>esbuild</h2>
        <p>100x faster bundler written in Go.</p>
        <ul>
          <li>Lightning fast builds</li>
          <li>TypeScript support</li>
          <li>Used by Vite, Remix</li>
        </ul>
      `,
      link: 'https://esbuild.github.io',
    },
    {
      title: 'HMR',
      description: 'Hot Module Replacement for instant updates during development.',
      icon: '🔥',
      color: '#ff6b6b',
      content: `
        <h2>Hot Module Replacement</h2>
        <p>Instant feedback on changes.</p>
        <ul>
          <li>Preserve app state</li>
          <li>No full page reload</li>
          <li>Faster development</li>
        </ul>
      `,
    },
  ];

  fuzzyMatch(query: string, text: string): boolean {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Simple substring match
    if (textLower.includes(queryLower)) return true;
    
    // Fuzzy match: check if all query chars appear in order
    let textIndex = 0;
    for (const char of queryLower) {
      textIndex = textLower.indexOf(char, textIndex);
      if (textIndex === -1) return false;
      textIndex++;
    }
    return true;
  }

  get filteredCards(): CardItem[] {
    if (!this.searchQuery.trim()) {
      return this.cards;
    }

    const query = this.searchQuery.toLowerCase().trim();
    return this.cards.filter(
      (card) =>
        this.fuzzyMatch(query, card.title) || 
        this.fuzzyMatch(query, card.description)
    );
  }

  openCard(card: CardItem): void {
    const WinBoxConstructor = (window as unknown as { WinBox: any }).WinBox;
    if (!WinBoxConstructor) {
      console.error('WinBox is not loaded');
      return;
    }
    const _win = new WinBoxConstructor({
      title: card.title,
      background: card.color,
      width: '600px',
      height: '500px',
      x: 'center',
      y: 'center',
      html: `
        <div style="padding: 20px; color: #333; height: 100%; overflow: auto; background: white;">
          ${card.content}
          ${card.link ? `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
              <a href="${card.link}" target="_blank" style="color: ${card.color}; text-decoration: none; font-weight: 500;">
                Visit ${card.title} Website →
              </a>
            </div>
          ` : ''}
        </div>
      `,
      onfocus: function () {
        this.setBackground(card.color);
      },
    });
  }
}
