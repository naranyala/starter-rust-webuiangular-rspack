// core/frontend/src/core/models.ts
/**
 * Core Models
 * 
 * Base model classes for MVVM pattern
 */

/**
 * Base model interface
 */
export interface IModel {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Base model implementation
 */
export abstract class BaseModel implements IModel {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  
  constructor(id: string) {
    this.id = id;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
  
  /**
   * Update the model timestamp
   */
  touch(): void {
    this.updatedAt = new Date();
  }
}

/**
 * Application state interface
 */
export interface IAppState {
  [key: string]: any;
}

/**
 * Observable property decorator
 */
export function observable<T>(target: any, propertyKey: string): void {
  const privateKey = `_${propertyKey}`;
  
  Object.defineProperty(target, propertyKey, {
    get(): T {
      return this[privateKey];
    },
    set(value: T) {
      const oldValue = this[privateKey];
      this[privateKey] = value;
      this.onPropertyChanged?.(propertyKey, oldValue, value);
    },
    enumerable: true,
    configurable: true
  });
}
