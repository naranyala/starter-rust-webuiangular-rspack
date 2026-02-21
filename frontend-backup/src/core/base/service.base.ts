// src/core/base/service.base.ts
// Base Service class for dependency injection

export abstract class BaseService {
  protected initialized = false;
  
  abstract readonly serviceName: string;
  
  initialize(): void {
    if (this.initialized) return;
    this.onInit();
    this.initialized = true;
  }
  
  protected abstract onInit(): void;
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  protected logInfo(message: string, ...args: unknown[]): void {
    console.log(`[${this.serviceName}] ${message}`, ...args);
  }
  
  protected logError(message: string, ...args: unknown[]): void {
    console.error(`[${this.serviceName}] ${message}`, ...args);
  }
  
  protected logWarn(message: string, ...args: unknown[]): void {
    console.warn(`[${this.serviceName}] ${message}`, ...args);
  }
}
