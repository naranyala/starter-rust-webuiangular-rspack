// core/frontend/src/error/errors.ts
/**
 * Error Classes - Hierarchical Error Types
 * 
 * Defines the error hierarchy for the application.
 */

/**
 * Base application error
 */
export abstract class AppError extends Error {
  abstract readonly name: string;
  abstract readonly code: string;
  readonly timestamp: number;
  readonly context: Record<string, any>;
  
  constructor(
    message: string,
    readonly cause?: Error,
    context: Record<string, any> = {}
  ) {
    super(message);
    this.timestamp = Date.now();
    this.context = context;
    
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
  
  /**
   * Convert to plain object
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      cause: this.cause?.message,
      context: this.context,
      timestamp: this.timestamp,
    };
  }
  
  /**
   * Add context to error
   */
  withContext(key: string, value: any): this {
    this.context[key] = value;
    return this;
  }
}

/**
 * Domain errors - business logic violations
 */
export class DomainError extends AppError {
  readonly name = 'DomainError';
}

export class DomainError {
  /**
   * Entity not found
   */
  static NotFound = class extends DomainError {
    readonly code = 'NOT_FOUND';
    
    constructor(
      readonly entity: string,
      readonly id: string
    ) {
      super(`${entity} not found: ${id}`);
    }
  };
  
  /**
   * Validation failed
   */
  static Validation = class extends DomainError {
    readonly code = 'VALIDATION_ERROR';
    
    constructor(
      readonly field: string,
      message: string,
      readonly value?: any
    ) {
      super(`Validation failed for '${field}': ${message}`);
      if (value !== undefined) {
        this.withContext('value', value);
      }
    }
  };
  
  /**
   * Business rule violation
   */
  static BusinessRule = class extends DomainError {
    readonly code = 'BUSINESS_RULE_VIOLATION';
    
    constructor(
      readonly rule: string,
      message: string
    ) {
      super(`Business rule '${rule}' violated: ${message}`);
    }
  };
  
  /**
   * Conflict (e.g., unique constraint)
   */
  static Conflict = class extends DomainError {
    readonly code = 'CONFLICT';
    
    constructor(
      readonly resource: string,
      message: string
    ) {
      super(`Conflict on '${resource}': ${message}`);
    }
  };
}

/**
 * Infrastructure errors - external system failures
 */
export class InfrastructureError extends AppError {
  readonly name = 'InfrastructureError';
}

export class InfrastructureError {
  /**
   * Database error
   */
  static Database = class extends InfrastructureError {
    readonly code = 'DATABASE_ERROR';
    
    constructor(
      readonly operation: string,
      message: string,
      readonly source?: string
    ) {
      super(`Database ${operation} failed: ${message}`);
      if (source) {
        this.withContext('source', source);
      }
    }
  };
  
  /**
   * Network error
   */
  static Network = class extends InfrastructureError {
    readonly code = 'NETWORK_ERROR';
    
    constructor(
      readonly url: string,
      message: string,
      readonly status?: number
    ) {
      super(`Network request to '${url}' failed: ${message}`);
      if (status) {
        this.withContext('status', status);
      }
    }
  };
  
  /**
   * Serialization error
   */
  static Serialization = class extends InfrastructureError {
    readonly code = 'SERIALIZATION_ERROR';
    
    constructor(
      readonly format: string,
      message: string
    ) {
      super(`${format} serialization failed: ${message}`);
    }
  };
}

/**
 * Application errors - use case failures
 */
export class ApplicationError extends AppError {
  readonly name = 'ApplicationError';
}

export class ApplicationError {
  /**
   * Invalid state
   */
  static InvalidState = class extends ApplicationError {
    readonly code = 'INVALID_STATE';
    
    constructor(
      readonly state: string,
      readonly expected: string
    ) {
      super(`Invalid state: got '${state}', expected '${expected}'`);
    }
  };
  
  /**
   * Operation timeout
   */
  static Timeout = class extends ApplicationError {
    readonly code = 'TIMEOUT';
    
    constructor(
      readonly operation: string,
      readonly timeoutMs: number
    ) {
      super(`Operation '${operation}' timed out after ${timeoutMs}ms`);
    }
  };
  
  /**
   * Operation canceled
   */
  static Canceled = class extends ApplicationError {
    readonly code = 'CANCELED';
    
    constructor(
      readonly operation: string,
      readonly reason: string
    ) {
      super(`Operation '${operation}' canceled: ${reason}`);
    }
  };
  
  /**
   * Internal error (should not happen)
   */
  static Internal = class extends ApplicationError {
    readonly code = 'INTERNAL_ERROR';
    
    constructor(message: string) {
      super(`Internal error: ${message}`);
    }
  };
}

/**
 * Plugin errors
 */
export class PluginError extends AppError {
  readonly name = 'PluginError';
}

export class PluginError {
  /**
   * Plugin not found
   */
  static NotFound = class extends PluginError {
    readonly code = 'PLUGIN_NOT_FOUND';
    
    constructor(readonly pluginId: string) {
      super(`Plugin not found: ${pluginId}`);
    }
  };
  
  /**
   * Failed to load plugin
   */
  static LoadFailed = class extends PluginError {
    readonly code = 'PLUGIN_LOAD_FAILED';
    
    constructor(
      readonly pluginId: string,
      message: string
    ) {
      super(`Failed to load plugin '${pluginId}': ${message}`);
    }
  };
  
  /**
   * Failed to initialize plugin
   */
  static InitFailed = class extends PluginError {
    readonly code = 'PLUGIN_INIT_FAILED';
    
    constructor(
      readonly pluginId: string,
      message: string
    ) {
      super(`Failed to initialize plugin '${pluginId}': ${message}`);
    }
  };
}

// Convenience functions
export const errors = {
  // Domain errors
  notFound: (entity: string, id: string) => new DomainError.NotFound(entity, id),
  validation: (field: string, message: string, value?: any) => 
    new DomainError.Validation(field, message, value),
  businessRule: (rule: string, message: string) => 
    new DomainError.BusinessRule(rule, message),
  conflict: (resource: string, message: string) => 
    new DomainError.Conflict(resource, message),
  
  // Infrastructure errors
  database: (operation: string, message: string, source?: string) =>
    new InfrastructureError.Database(operation, message, source),
  network: (url: string, message: string, status?: number) =>
    new InfrastructureError.Network(url, message, status),
  serialization: (format: string, message: string) =>
    new InfrastructureError.Serialization(format, message),
  
  // Application errors
  invalidState: (state: string, expected: string) =>
    new ApplicationError.InvalidState(state, expected),
  timeout: (operation: string, timeoutMs: number) =>
    new ApplicationError.Timeout(operation, timeoutMs),
  canceled: (operation: string, reason: string) =>
    new ApplicationError.Canceled(operation, reason),
  internal: (message: string) =>
    new ApplicationError.Internal(message),
  
  // Plugin errors
  pluginNotFound: (pluginId: string) =>
    new PluginError.NotFound(pluginId),
  pluginLoadFailed: (pluginId: string, message: string) =>
    new PluginError.LoadFailed(pluginId, message),
  pluginInitFailed: (pluginId: string, message: string) =>
    new PluginError.InitFailed(pluginId, message),
};
