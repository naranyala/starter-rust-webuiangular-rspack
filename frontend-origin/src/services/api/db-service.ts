import { IDbService } from '../shared/types/services';

export class DbService implements IDbService {
  async getUsers(): Promise<any> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.webui) {
        window.webui.call('get_users', (response: any) => {
          resolve(response);
        });
      } else {
        resolve({ error: 'WebUI not available' });
      }
    });
  }

  async getStats(): Promise<any> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.webui) {
        window.webui.call('get_db_stats', (response: any) => {
          resolve(response);
        });
      } else {
        resolve({ error: 'WebUI not available' });
      }
    });
  }

  refreshUsers(): void {
    if (typeof window !== 'undefined' && window.webui) {
      window.webui.call('get_users');
    }
  }
}