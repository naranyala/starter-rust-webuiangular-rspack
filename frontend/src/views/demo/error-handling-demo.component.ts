import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GlobalErrorService } from '../../core/global-error.service';
import { ErrorCode, type ErrorValue, isErr, isOk } from '../../types';
import { createUser, deleteUser, getUsers, type User } from '../../viewmodels';
import { getLogger } from '../../viewmodels/logger.viewmodel';

interface UserForm {
  name: string;
  email: string;
  role: string;
  status: string;
}

@Component({
  selector: 'app-error-handling-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="demo-container">
      <header class="header">
        <h1>Errors as Values - Demo</h1>
        <p class="subtitle">Demonstrating structured error handling in Angular</p>
      </header>

      <!-- Error Display Section -->
      @if (errorService.hasError()) {
        @let activeError = errorService.activeError();
        <div class="current-error" [class.error-validation]="errorService.isErrorCode(ErrorCode.ValidationFailed)">
          <div class="error-header">
            <span class="error-icon">⚠️</span>
            <strong>Current Error:</strong>
          </div>
          <p class="error-message">{{ activeError!.userMessage }}</p>
          <p class="error-code">Code: {{ activeError!.error.code }}</p>
          @if (activeError!.error.field) {
            <p class="error-field">Field: {{ activeError!.error.field }}</p>
          }
          <button class="dismiss-btn" (click)="errorService.dismiss()">Dismiss</button>
        </div>
      }

      <!-- User List Section -->
      <section class="section">
        <h2>Strategy 1: Direct Result Handling</h2>
        <p class="section-desc">Handle Result types explicitly with pattern matching</p>
        
        <div class="action-bar">
          <button class="btn btn-primary" (click)="loadUsers()" [disabled]="loading">
            {{ loading ? 'Loading...' : 'Load Users' }}
          </button>
          <button class="btn btn-secondary" (click)="loadUsersWithFallback()">
            Load with Fallback
          </button>
        </div>

        @if (users.length > 0) {
          <div class="user-list">
            <div class="user-item" *ngFor="let user of users">
              <div class="user-info">
                <span class="user-name">{{ user.name }}</span>
                <span class="user-email">{{ user.email }}</span>
                <span class="user-role">{{ user.role }}</span>
                <span class="user-status" [class.active]="user.status === 'Active'">{{ user.status }}</span>
              </div>
              <button class="btn btn-small btn-danger" (click)="deleteUser(user.id)">Delete</button>
            </div>
          </div>
        }

        @if (loadError) {
          <div class="error-message-block">
            <strong>Error loading users:</strong> {{ loadError.message }}
            <pre class="error-details">{{ loadError.code }}</pre>
          </div>
        }
      </section>

      <!-- Create User Section -->
      <section class="section">
        <h2>Strategy 2: Error Service Integration</h2>
        <p class="section-desc">Use GlobalErrorService to handle and display errors automatically</p>
        
        <form class="user-form" (ngSubmit)="handleCreateUser()" #form="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label for="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                [(ngModel)]="formModel.name"
                required
                minlength="2"
                #nameModel="ngModel"
                [class.invalid]="nameModel.invalid && nameModel.touched"
              />
              @if (nameModel.invalid && nameModel.touched) {
                <span class="field-error">Name is required (min 2 characters)</span>
              }
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                [(ngModel)]="formModel.email"
                required
                email
                #emailModel="ngModel"
                [class.invalid]="emailModel.invalid && emailModel.touched"
              />
              @if (emailModel.invalid && emailModel.touched) {
                <span class="field-error">Valid email is required</span>
              }
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="role">Role</label>
              <select id="role" name="role" [(ngModel)]="formModel.role">
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="Editor">Editor</option>
              </select>
            </div>

            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" name="status" [(ngModel)]="formModel.status">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div class="action-bar">
            <button type="submit" class="btn btn-success" [disabled]="form.invalid || creating">
              {{ creating ? 'Creating...' : 'Create User' }}
            </button>
            <button type="button" class="btn btn-secondary" (click)="createUserWithValidation()">
              Create with Extra Validation
            </button>
          </div>
        </form>
      </section>

      <!-- Error Scenarios Section -->
      <section class="section">
        <h2>Strategy 3: Triggering Different Error Types</h2>
        <p class="section-desc">See how different error types are handled and displayed</p>
        
        <div class="error-scenarios">
          <button class="btn btn-warning" (click)="triggerValidationError()">
            Trigger Validation Error
          </button>
          <button class="btn btn-warning" (click)="triggerNotFoundError()">
            Trigger Not Found Error
          </button>
          <button class="btn btn-warning" (click)="triggerDuplicateError()">
            Trigger Duplicate Error
          </button>
          <button class="btn btn-warning" (click)="triggerBackendError()">
            Trigger Backend Error
          </button>
        </div>

        <div class="error-examples">
          <h3>Error Handling Patterns</h3>
          
          <div class="example">
            <h4>Pattern 1: Result Type</h4>
            <pre class="code">{{ codeExamples.result }}</pre>
          </div>

          <div class="example">
            <h4>Pattern 2: Error Service</h4>
            <pre class="code">{{ codeExamples.service }}</pre>
          </div>

          <div class="example">
            <h4>Pattern 3: Chaining</h4>
            <pre class="code">{{ codeExamples.chaining }}</pre>
          </div>
        </div>
      </section>

      <!-- Info Section -->
      <section class="section info-section">
        <h2>Key Concepts</h2>
        <ul class="concept-list">
          <li>
            <strong>Errors are values:</strong> They flow through your application like any other data
          </li>
          <li>
            <strong>Type-safe:</strong> TypeScript discriminated unions ensure all error cases are handled
          </li>
          <li>
            <strong>Structured:</strong> Error codes, messages, and context enable programmatic handling
          </li>
          <li>
            <strong>Cross-boundary:</strong> Same error structure on backend (Rust) and frontend (TypeScript)
          </li>
          <li>
            <strong>Composable:</strong> Use map, chain, and other functional combinators
          </li>
        </ul>
      </section>
    </div>
  `,
  styles: [
    `
    .demo-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .header h1 {
      font-size: 2rem;
      color: #1a1a2e;
      margin-bottom: 8px;
    }

    .subtitle {
      color: #666;
      font-size: 1.1rem;
    }

    .current-error {
      background: #fff5f5;
      border: 2px solid #fc8181;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .current-error.error-validation {
      background: #fffff0;
      border-color: #f0e68c;
    }

    .error-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      color: #c53030;
    }

    .error-message {
      margin: 0 0 8px;
      color: #2d3748;
    }

    .error-code, .error-field {
      margin: 4px 0;
      font-size: 0.85rem;
      color: #718096;
      font-family: 'SF Mono', 'Consolas', monospace;
    }

    .dismiss-btn {
      margin-top: 8px;
      padding: 6px 16px;
      background: #c53030;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .dismiss-btn:hover {
      background: #9b2c2c;
    }

    .section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .section h2 {
      margin: 0 0 8px;
      color: #1a1a2e;
      font-size: 1.4rem;
    }

    .section-desc {
      color: #666;
      margin-bottom: 20px;
    }

    .action-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #0f3460;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1a4a7a;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #2d3748;
    }

    .btn-secondary:hover {
      background: #cbd5e1;
    }

    .btn-success {
      background: #38a169;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #2f855a;
    }

    .btn-warning {
      background: #dd6b20;
      color: white;
    }

    .btn-warning:hover {
      background: #c05621;
    }

    .btn-danger {
      background: #e53e3e;
      color: white;
    }

    .btn-danger:hover {
      background: #c53030;
    }

    .btn-small {
      padding: 6px 12px;
      font-size: 0.85rem;
    }

    .user-list {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .user-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .user-item:last-child {
      border-bottom: none;
    }

    .user-info {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .user-name {
      font-weight: 600;
      color: #2d3748;
    }

    .user-email {
      color: #718096;
      font-size: 0.9rem;
    }

    .user-role, .user-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85rem;
      background: #edf2f7;
    }

    .user-status.active {
      background: #c6f6d5;
      color: #22543d;
    }

    .error-message-block {
      margin-top: 16px;
      padding: 12px;
      background: #fff5f5;
      border-left: 3px solid #fc8181;
      border-radius: 4px;
    }

    .error-details {
      margin-top: 8px;
      padding: 8px;
      background: #1a202c;
      color: #e2e8f0;
      border-radius: 4px;
      font-family: 'SF Mono', 'Consolas', monospace;
      font-size: 0.85rem;
      overflow: auto;
    }

    .user-form {
      max-width: 600px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      margin-bottom: 6px;
      font-weight: 500;
      color: #2d3748;
    }

    .form-group input,
    .form-group select {
      padding: 10px;
      border: 2px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.95rem;
    }

    .form-group input.invalid,
    .form-group select.invalid {
      border-color: #fc8181;
    }

    .field-error {
      margin-top: 4px;
      font-size: 0.85rem;
      color: #e53e3e;
    }

    .error-scenarios {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 24px;
    }

    .error-examples {
      margin-top: 24px;
    }

    .error-examples h3 {
      margin-bottom: 16px;
      color: #1a1a2e;
    }

    .example {
      margin-bottom: 16px;
    }

    .example h4 {
      margin-bottom: 8px;
      color: #2d3748;
      font-size: 1rem;
    }

    .code {
      background: #1a202c;
      color: #e2e8f0;
      padding: 16px;
      border-radius: 8px;
      font-family: 'SF Mono', 'Consolas', monospace;
      font-size: 0.85rem;
      overflow: auto;
      line-height: 1.5;
    }

    .info-section {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
    }

    .concept-list {
      list-style: none;
      padding: 0;
    }

    .concept-list li {
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
      line-height: 1.6;
    }

    .concept-list li:last-child {
      border-bottom: none;
    }

    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .action-bar {
        flex-wrap: wrap;
      }
    }
  `,
  ],
})
export class ErrorHandlingDemoComponent {
  readonly errorService = inject(GlobalErrorService);
  private readonly logger = getLogger('error-handling-demo');

  users: User[] = [];
  loading = false;
  creating = false;
  loadError: { code: string; message: string } | null = null;

  formModel: UserForm = {
    name: '',
    email: '',
    role: 'User',
    status: 'Active',
  };

  ErrorCode = ErrorCode;

  codeExamples = {
    result: `// Pattern 1: Direct Result handling
const result = await getUsers();

if (isOk(result)) {
  console.log('Users:', result.value);
} else {
  console.error('Error:', result.error.message);
  console.error('Code:', result.error.code);
}`,

    service: `// Pattern 2: Error Service
const users = errorService.handleResult(
  await getUsers(),
  { source: 'user-list', title: 'Failed to load' }
);

if (users) {
  // Success - users loaded
} else {
  // Error already displayed to user
}`,

    chaining: `// Pattern 3: Chaining operations
const result = await getUsers();

const activeUsers = mapResult(
  result,
  users => users.filter(u => u.status === 'Active')
);

// Error propagates automatically if previous step failed`,
  };

  async loadUsers(): Promise<void> {
    this.loading = true;
    this.loadError = null;

    const result = await getUsers();

    if (isOk(result)) {
      this.users = result.value;
      this.logger.info('Users loaded successfully', { count: this.users.length });
    } else {
      this.loadError = {
        code: result.error.code,
        message: result.error.message,
      };
      this.logger.error('Failed to load users', { error: result.error });
    }

    this.loading = false;
  }

  async loadUsersWithFallback(): Promise<void> {
    this.loading = true;
    this.loadError = null;

    const result = await getUsers();
    const users = this.errorService.handleResult(result, {
      source: 'user-list',
      title: 'Failed to load users',
    });

    if (users) {
      this.users = users;
    } else {
      // Use empty array as fallback
      this.users = [];
    }

    this.loading = false;
  }

  async handleCreateUser(): Promise<void> {
    this.creating = true;

    const result = await createUser({
      name: this.formModel.name,
      email: this.formModel.email,
      role: this.formModel.role,
      status: this.formModel.status,
    });

    if (isOk(result)) {
      this.logger.info('User created', { id: result.value });
      this.formModel = { name: '', email: '', role: 'User', status: 'Active' };
      this.loadUsers(); // Refresh list
    } else {
      // Let error service handle it
      this.errorService.handleResult(result, {
        source: 'create-user',
        title: 'Failed to create user',
      });
    }

    this.creating = false;
  }

  async createUserWithValidation(): Promise<void> {
    // Extra validation before calling backend
    if (this.formModel.name.length < 2) {
      this.errorService.validationError('name', 'Name must be at least 2 characters');
      return;
    }

    if (!this.formModel.email.includes('@')) {
      this.errorService.validationError('email', 'Email must be valid');
      return;
    }

    await this.handleCreateUser();
  }

  async deleteUser(id: number): Promise<void> {
    const result = await deleteUser(id);

    if (isOk(result)) {
      this.logger.info('User deleted', { id });
      this.users = this.users.filter(u => u.id !== id);
    } else {
      this.errorService.handleResult(result, {
        source: 'delete-user',
        title: 'Failed to delete user',
      });
    }
  }

  triggerValidationError(): void {
    this.errorService.validationError('email', 'This email format is invalid', {
      source: 'demo',
      title: 'Validation Example',
    });
  }

  triggerNotFoundError(): void {
    this.errorService.notFoundError('User', 999, { source: 'demo', title: 'Not Found Example' });
  }

  async triggerDuplicateError(): Promise<void> {
    // Try to create a user with an email that already exists
    const result = await createUser({
      name: 'Duplicate User',
      email: 'john@example.com', // Assuming this exists in sample data
      role: 'User',
      status: 'Active',
    });

    if (isErr(result)) {
      // The error will be displayed automatically by error service
      this.errorService.report(result.error, {
        source: 'demo',
        title: 'Duplicate Error Example',
      });
    }
  }

  triggerBackendError(): void {
    // Simulate a backend error
    const error: ErrorValue = {
      code: ErrorCode.InternalError,
      message: 'This simulates a backend error',
      details: 'In a real scenario, this would come from the Rust backend',
      cause: 'Simulated for demonstration',
    };

    this.errorService.report(error, {
      source: 'demo',
      title: 'Backend Error Example',
    });
  }
}
