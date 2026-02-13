import { DbService } from '../../../services/api/db-service';
import { logger } from '../../../shared/utils/logger';

export class UserManagementComponent {
  private container: HTMLElement;
  private dbService: DbService;
  private usersData: any = null;
  private statsData: any = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.dbService = new DbService();
    this.init();
  }

  private async init(): Promise<void> {
    logger.info('UserManagement component initialized');
    await Promise.all([this.loadUsers(), this.loadStats()]);
    this.render();
    this.attachEventListeners();
  }

  private async loadUsers(): Promise<void> {
    try {
      this.usersData = await this.dbService.getUsers();
      logger.info('Users loaded:', this.usersData);
    } catch (error) {
      logger.error('Error loading users:', error);
    }
  }

  private async loadStats(): Promise<void> {
    try {
      this.statsData = await this.dbService.getStats();
      logger.info('Stats loaded:', this.statsData);
    } catch (error) {
      logger.error('Error loading stats:', error);
    }
  }

  private render(): void {
    const users = this.usersData?.data || [];
    const stats = this.statsData?.stats || {};

    this.container.innerHTML = `
      <div class="user-management">
        <h2>User Management</h2>
        
        <div class="stats-summary">
          <h3>Database Statistics</h3>
          <p>Total Users: ${stats.users || 0}</p>
          <p>Tables: ${stats.tables?.join(', ') || 'N/A'}</p>
        </div>
        
        <div class="users-list">
          <h3>Users</h3>
          ${users.length === 0 ? 
            '<p>No users found.</p>' : 
            this.getUsersTableTemplate(users)
          }
        </div>
      </div>
    `;
  }

  private getUsersTableTemplate(users: any[]): string {
    return `
      <table class="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => this.getUserRowTemplate(user)).join('')}
        </tbody>
      </table>
    `;
  }

  private getUserRowTemplate(user: any): string {
    return `
      <tr data-user-id="${user.id}">
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${user.status}</td>
        <td>
          <button class="btn-edit" data-user-id="${user.id}">Edit</button>
          <button class="btn-delete" data-user-id="${user.id}">Delete</button>
        </td>
      </tr>
    `;
  }

  private attachEventListeners(): void {
    this.container.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      if (target.classList.contains('btn-edit')) {
        const userId = target.getAttribute('data-user-id');
        this.handleEditUser(userId);
      }
      
      if (target.classList.contains('btn-delete')) {
        const userId = target.getAttribute('data-user-id');
        this.handleDeleteUser(userId);
      }
    });
  }

  private handleEditUser(userId: string | null): void {
    if (userId) {
      logger.info(`Edit user ${userId}`);
      // Implementation for editing user
    }
  }

  private handleDeleteUser(userId: string | null): void {
    if (userId && confirm(`Are you sure you want to delete user ${userId}?`)) {
      logger.info(`Delete user ${userId}`);
      // Implementation for deleting user
    }
  }

  public destroy(): void {
    this.container.innerHTML = '';
    logger.info('UserManagement component destroyed');
  }
}