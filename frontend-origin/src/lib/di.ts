/**
 * Dependency Injection Container for Frontend
 */

interface ServiceIdentifier<T> {
  new(...args: any[]): T;
}

class DependencyContainer {
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();
  private singletons = new Map<string, any>();
  private dependencies = new Map<string, Array<string | symbol>>();

  /**
   * Register a class as a singleton
   */
  registerSingleton<T>(key: string | symbol, cls: new (...args: any[]) => T): void {
    this.services.set(key.toString(), {
      useClass: cls,
      singleton: true
    });
  }

  /**
   * Register a factory function
   */
  registerFactory<T>(key: string | symbol, factory: () => T): void {
    this.factories.set(key.toString(), factory);
  }

  /**
   * Register a value as a singleton
   */
  registerValue<T>(key: string | symbol, value: T): void {
    this.singletons.set(key.toString(), value);
  }

  /**
   * Register a service with dependencies
   */
  registerWithDependencies<T>(
    key: string | symbol, 
    cls: new (...args: any[]) => T, 
    dependencies: Array<string | symbol>
  ): void {
    this.services.set(key.toString(), {
      useClass: cls,
      dependencies: dependencies.map(dep => dep.toString())
    });
    this.dependencies.set(key.toString(), dependencies);
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(key: string | symbol): T {
    const keyStr = key.toString();
    
    // Check if it's already a singleton
    if (this.singletons.has(keyStr)) {
      return this.singletons.get(keyStr);
    }

    // Check if it's a factory
    if (this.factories.has(keyStr)) {
      const factory = this.factories.get(keyStr);
      const instance = factory();
      
      // Register as singleton if marked as such
      const serviceDef = this.services.get(keyStr);
      if (serviceDef && serviceDef.singleton) {
        this.singletons.set(keyStr, instance);
      }
      
      return instance;
    }

    // Check if it's a class to instantiate
    if (this.services.has(keyStr)) {
      const serviceDef = this.services.get(keyStr);
      
      if (serviceDef.useClass) {
        // Get dependencies if any
        const deps = this.dependencies.get(keyStr) || [];
        const resolvedDeps = deps.map(dep => this.resolve(dep));
        
        // Create instance
        const instance = new serviceDef.useClass(...resolvedDeps);
        
        // Register as singleton if marked as such
        if (serviceDef.singleton) {
          this.singletons.set(keyStr, instance);
        }
        
        return instance;
      }
    }

    throw new Error(`Service not found: ${keyStr}`);
  }

  /**
   * Check if a service is registered
   */
  has(key: string | symbol): boolean {
    return this.services.has(key.toString()) || 
           this.factories.has(key.toString()) || 
           this.singletons.has(key.toString());
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
    this.dependencies.clear();
  }
}

// Global container instance
const container = new DependencyContainer();

export { container, DependencyContainer };
export type { ServiceIdentifier };