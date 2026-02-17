// core/frontend/src/core/service.ts
/**
 * Core Services
 * 
 * Base service classes
 */

/**
 * Base service interface
 */
export interface IService {
  name: string;
  initialize(): Promise<void>;
  dispose(): Promise<void>;
}

/**
 * Base service implementation
 */
export abstract class BaseService implements IService {
  name: string = '';
  
  async initialize(): Promise<void> {
    // Override in subclass
  }
  
  async dispose(): Promise<void> {
    // Override in subclass
  }
}

/**
 * Backend service for communicating with Rust backend
 */
export class BackendService extends BaseService {
  name = 'backend';
  
  /**
   * Call a backend function
   */
  async call<T>(functionName: string, payload?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && (window as any).WebUIBridge) {
        (window as any).WebUIBridge.callRustFunction(functionName, payload)
          .then((result: any) => {
            try {
              resolve(typeof result === 'string' ? JSON.parse(result) : result);
            } catch {
              resolve(result);
            }
          })
          .catch(reject);
      } else {
        reject(new Error('WebUIBridge not available'));
      }
    });
  }
  
  /**
   * Subscribe to backend events
   */
  onEvent(eventType: string, handler: (payload: any) => void): () => void {
    if (typeof window !== 'undefined') {
      const listener = (event: Event) => {
        const customEvent = event as CustomEvent;
        handler(customEvent.detail);
      };
      
      window.addEventListener(eventType, listener);
      
      return () => {
        window.removeEventListener(eventType, listener);
      };
    }
    
    return () => {};
  }
}
