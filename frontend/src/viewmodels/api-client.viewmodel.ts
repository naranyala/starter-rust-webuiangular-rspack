// frontend/src/viewmodels/api-client.ts
// API client for backend communication using "errors as values" pattern
//
// This client demonstrates how to:
// 1. Call backend functions and handle structured errors
// 2. Convert API responses to Result types
// 3. Propagate errors as values through the application

import {
  type ApiResponse,
  ErrorCode,
  type ErrorValue,
  isError,
  isSuccess,
  type Result,
  toResult,
} from '../types';
import { getLogger } from './logger.viewmodel';

const logger = getLogger('api-client');

/**
 * Call a backend function and return a typed Result
 *
 * @param functionName - Name of the bound backend function
 * @param args - Arguments to pass to the backend function
 * @returns Promise resolving to a Result type
 */
export async function callBackend<T>(functionName: string, ...args: unknown[]): Promise<Result<T>> {
  logger.debug(`Calling backend: ${functionName}`, { args: JSON.stringify(args) });

  return new Promise(resolve => {
    // Set up one-time event listener for the response
    const responseEventName = getResponseEventName(functionName);

    const handler = (event: CustomEvent<ApiResponse<T>>) => {
      logger.debug(`Received response for ${functionName}`);

      const response = event.detail;

      if (isError(response)) {
        logger.warn(`Backend error: ${response.error.code}`, { error: response.error });
        resolve(toResult<T>(response));
      } else if (isSuccess(response)) {
        logger.info(`Backend success: ${functionName}`);
        resolve(toResult<T>(response));
      }
    };

    // Set timeout to handle cases where backend doesn't respond
    const timeoutId = setTimeout(() => {
      window.removeEventListener(responseEventName, handler as EventListener);
      logger.error(`Backend call timeout: ${functionName}`);
      resolve({
        ok: false,
        error: {
          code: ErrorCode.InternalError,
          message: `Backend call timeout: ${functionName}`,
          details: 'No response received within timeout period',
        } as ErrorValue,
      } as Result<T, ErrorValue>);
    }, 30000); // 30 second timeout

    window.addEventListener(responseEventName, handler as EventListener, { once: true });

    // Call the backend function
    try {
      const backendFn = (window as unknown as Record<string, unknown>)[functionName];

      if (typeof backendFn !== 'function') {
        clearTimeout(timeoutId);
        window.removeEventListener(responseEventName, handler as EventListener);
        logger.error(`Backend function not found: ${functionName}`);
        resolve({
          ok: false,
          error: {
            code: ErrorCode.InternalError,
            message: `Backend function not found: ${functionName}`,
            details: 'The function is not bound or available',
          } as ErrorValue,
        } as Result<T, ErrorValue>);
        return;
      }

      // Call the backend function with provided arguments
      backendFn(...args);
      logger.debug(`Backend call initiated: ${functionName}`);
    } catch (error) {
      clearTimeout(timeoutId);
      window.removeEventListener(responseEventName, handler as EventListener);
      logger.error(`Backend call failed: ${functionName}`, { error: String(error) });
      resolve({
        ok: false,
        error: {
          code: ErrorCode.InternalError,
          message: `Failed to call backend: ${functionName}`,
          cause: error instanceof Error ? error.message : String(error),
        } as ErrorValue,
      } as Result<T, ErrorValue>);
    }
  });
}

/**
 * Get the expected response event name for a backend function
 */
function getResponseEventName(functionName: string): string {
  // Map function names to their response events
  const eventMap: Record<string, string> = {
    get_users: 'db_response',
    create_user: 'user_create_response',
    update_user: 'user_update_response',
    delete_user: 'user_delete_response',
    get_db_stats: 'stats_response',
  };

  return eventMap[functionName] || `${functionName}_response`;
}

/**
 * User API functions
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export interface UserCreatePayload {
  name: string;
  email: string;
  role?: string;
  status?: string;
}

export interface UserUpdatePayload {
  id: number;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
}

/**
 * Get all users from the backend
 */
export async function getUsers(): Promise<Result<User[]>> {
  return callBackend<User[]>('get_users');
}

/**
 * Create a new user
 *
 * @param payload - User creation data
 * @returns Result with the new user ID on success
 */
export async function createUser(payload: UserCreatePayload): Promise<Result<number>> {
  const elementName = `create_user:${payload.name}:${payload.email}:${payload.role ?? 'User'}:${payload.status ?? 'Active'}`;
  return callBackend<number>('create_user', elementName);
}

/**
 * Update an existing user
 *
 * @param payload - User update data
 * @returns Result with rows updated count
 */
export async function updateUser(payload: UserUpdatePayload): Promise<Result<number>> {
  const elementName = `update_user:${payload.id}:${payload.name ?? ''}:${payload.email ?? ''}:${payload.role ?? ''}:${payload.status ?? ''}`;
  return callBackend<number>('update_user', elementName);
}

/**
 * Delete a user by ID
 *
 * @param id - User ID to delete
 * @returns Result with rows deleted count
 */
export async function deleteUser(id: number): Promise<Result<number>> {
  const elementName = `delete_user:${id}`;
  return callBackend<number>('delete_user', elementName);
}

/**
 * Example usage with different error handling strategies:
 *
 * // Strategy 1: Handle Result directly
 * const result = await getUsers();
 * if (result.ok) {
 *   console.log('Users:', result.value);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 *
 * // Strategy 2: Use with GlobalErrorService
 * const users = errorService.handleResult(await getUsers(), {
 *   source: 'user-list',
 *   title: 'Failed to load users'
 * });
 *
 * // Strategy 3: Chain operations
 * const result = await getUsers();
 * const filtered = mapResult(result, users => users.filter(u => u.status === 'Active'));
 *
 * // Strategy 4: Async/await with pattern matching
 * const createResult = await createUser({ name: 'John', email: 'john@example.com' });
 * if (createResult.ok) {
 *   // Success path
 * } else {
 *   // Error path - error is a value, not an exception
 * }
 */
