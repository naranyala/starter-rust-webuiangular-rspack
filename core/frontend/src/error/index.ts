// core/frontend/src/error/index.ts
/**
 * Error Handling - Errors as Values
 * 
 * This module provides a comprehensive error handling system based on
 * the "errors as values" pattern. Errors are regular values that must
 * be explicitly handled, not exceptions.
 * 
 * @example
 * ```typescript
 * import { Result, AppError, DomainError } from '@core/error';
 * 
 * async function getUser(id: string): Promise<Result<User>> {
 *   const user = await db.find(id);
 *   if (!user) {
 *     return Result.err(new DomainError.NotFound('User', id));
 *   }
 *   return Result.ok(user);
 * }
 * 
 * // Handle errors explicitly
 * const result = await getUser('123');
 * if (result.isErr) {
 *   if (result.error instanceof DomainError.NotFound) {
 *     console.log('User not found');
 *   }
 * } else {
 *   console.log('Found:', result.value.name);
 * }
 * ```
 */

export * from './result';
export * from './errors';
export * from './handler';
