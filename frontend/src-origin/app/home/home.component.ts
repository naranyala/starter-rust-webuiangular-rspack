import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home-container">
      <h1>Angular Rspack Demo</h1>
      <p class="subtitle">A minimal Angular 19 application bundled with Rspack</p>
      <a routerLink="/demo" class="btn">View Accordion Demo →</a>
    </div>
  `,
  styles: [`
    .home-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      text-align: center;
    }
    h1 {
      font-size: 48px;
      color: #333;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 20px;
      color: #666;
      margin-bottom: 30px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #4a90d9;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-size: 18px;
      transition: background 0.3s;
    }
    .btn:hover {
      background: #3a7bc8;
    }
  `],
})
export class HomeComponent {}
