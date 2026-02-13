/**
 * Database Service Implementation
 */

import { IDbService } from './services.js';

export class DbService implements IDbService {
  async getUsers(): Promise<any> {
    // Call the Rust backend function to get users
    if (window.getUsers) {
      return new Promise((resolve) => {
        // Listen for the response event
        const listener = (event: CustomEvent) => {
          window.removeEventListener('db_response', listener as EventListener);
          resolve(event.detail);
        };
        
        window.addEventListener('db_response', listener as EventListener);
        window.getUsers();
      });
    }
    
    // Return mock data if backend function is not available
    return {
      success: true,
      data: [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
      ]
    };
  }

  async getStats(): Promise<any> {
    // Call the Rust backend function to get stats
    if (window.getDbStats) {
      return new Promise((resolve) => {
        // Listen for the response event
        const listener = (event: CustomEvent) => {
          window.removeEventListener('stats_response', listener as EventListener);
          resolve(event.detail);
        };
        
        window.addEventListener('stats_response', listener as EventListener);
        window.getDbStats();
      });
    }
    
    // Return mock stats if backend function is not available
    return {
      success: true,
      stats: {
        users: 3,
        tables: ['users', 'products']
      }
    };
  }

  refreshUsers(): void {
    if (window.getUsers) {
      window.getUsers();
    }
  }
}