// core/frontend/src/core/viewmodel.ts
/**
 * ViewModel Base Class
 * 
 * Foundation for all ViewModels in the MVVM pattern
 */

import { EventBus } from './events';
import { IModel } from './models';

/**
 * Base ViewModel class
 */
export abstract class BaseViewModel {
  protected eventBus: EventBus;
  protected isDisposed = false;
  
  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || EventBus.getInstance();
  }
  
  /**
   * Initialize the ViewModel
   */
  abstract initialize(): Promise<void>;
  
  /**
   * Dispose resources
   */
  abstract dispose(): void;
  
  /**
   * Call backend function
   */
  protected async callBackend<T>(functionName: string, payload?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && (window as any).WebUIBridge) {
        (window as any).WebUIBridge.callRustFunction(functionName, payload)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error('WebUIBridge not available'));
      }
    });
  }
  
  /**
   * Publish event
   */
  protected publish(eventType: string, payload: any): void {
    this.eventBus.publish(eventType, payload);
  }
  
  /**
   * Subscribe to event
   */
  protected subscribe(eventType: string, handler: (payload: any) => void): () => void {
    return this.eventBus.subscribe(eventType, handler);
  }
  
  /**
   * Handle property change (for observable properties)
   */
  protected onPropertyChanged?(propertyKey: string, oldValue: any, newValue: any): void;
}

/**
 * ViewModel state
 */
export interface ViewModelState {
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
}

/**
 * Stateful ViewModel base
 */
export abstract class StatefulViewModel extends BaseViewModel {
  state: ViewModelState = {
    isLoading: false,
    error: null,
    initialized: false
  };
  
  async initialize(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    
    try {
      await this.onInitialize();
      this.state.initialized = true;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      this.state.isLoading = false;
    }
  }
  
  /**
   * Override this method for initialization logic
   */
  protected abstract onInitialize(): Promise<void>;
}
