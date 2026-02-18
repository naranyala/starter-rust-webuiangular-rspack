// frontend/src/event-bus-integration.ts
// Integration layer between frontend EventBus and Rust backend EventBus

import { EventBus, EventBusFactory } from './event-bus';

class EventBusBridge {
  private frontendBus: EventBus;
  private backendConnected: boolean = false;
  private subscriptionIds: Map<string, string> = new Map();
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(frontendBus?: EventBus) {
    this.frontendBus = frontendBus || EventBusFactory.getDefault();
    this.init();
  }

  private init() {
    this.frontendBus.on('app:ready', () => {
      this.connectToBackend();
    });

    setTimeout(() => {
      if (!this.backendConnected) {
        this.connectToBackend();
      }
    }, 1000);
  }

  async connectToBackend(): Promise<boolean> {
    if (this.retryCount >= this.maxRetries) {
      console.warn('EventBus Bridge: Max retries reached, running in offline mode');
      return false;
    }

    try {
      if (window.WebUIBridge?.callRustFunction) {
        await window.WebUIBridge.callRustFunction('event:stats', {});
        this.backendConnected = true;
        this.retryCount = 0;
        console.log('EventBus Bridge: Connected to backend');
        
        this.frontendBus.emit('bridge:connected', { timestamp: Date.now() });
        return true;
      }
    } catch (e) {
      this.retryCount++;
      console.warn(`EventBus Bridge: Connection failed (retry ${this.retryCount}/${this.maxRetries})`);
      
      if (this.retryCount < this.maxRetries) {
        setTimeout(() => this.connectToBackend(), this.retryDelay);
      }
    }

    return false;
  }

  isConnected(): boolean {
    return this.backendConnected;
  }

  async subscribeToBackend(eventType: string, callback: (data: any) => void): Promise<string | null> {
    if (!this.backendConnected) {
      console.warn('EventBus Bridge: Not connected to backend');
      return null;
    }

    const frontendId = this.frontendBus.on(eventType, callback);
    
    try {
      const response = await window.WebUIBridge.callRustFunction('event:subscribe', {
        event_type: eventType,
        callback_id: frontendId
      });

      if (response.success) {
        this.subscriptionIds.set(frontendId, response.subscription_id);
        return frontendId;
      }
    } catch (e) {
      console.error('EventBus Bridge: Failed to subscribe to backend:', e);
    }

    return null;
  }

  async publishToBackend(eventType: string, data: any): Promise<boolean> {
    if (!this.backendConnected) {
      console.warn('EventBus Bridge: Not connected to backend');
      return false;
    }

    try {
      const response = await window.WebUIBridge.callRustFunction('event:publish', {
        event_type: eventType,
        data,
        source: 'frontend'
      });

      return response.success;
    } catch (e) {
      console.error('EventBus Bridge: Failed to publish to backend:', e);
      return false;
    }
  }

  async getBackendHistory(eventType?: string, limit?: number): Promise<any[]> {
    if (!this.backendConnected) {
      return [];
    }

    try {
      const response = await window.WebUIBridge.callRustFunction('event:history', {
        event_type: eventType,
        limit: limit || 50
      });

      return response.events || [];
    } catch (e) {
      console.error('EventBus Bridge: Failed to get backend history:', e);
      return [];
    }
  }

  async getBackendStats(): Promise<any> {
    if (!this.backendConnected) {
      return null;
    }

    try {
      return await window.WebUIBridge.callRustFunction('event:stats', {});
    } catch (e) {
      console.error('EventBus Bridge: Failed to get backend stats:', e);
      return null;
    }
  }

  async unsubscribeFromBackend(eventType: string): Promise<boolean> {
    if (!this.backendConnected) {
      return false;
    }

    try {
      const response = await window.WebUIBridge.callRustFunction('event:unsubscribe', {
        event_type: eventType
      });

      return response.success;
    } catch (e) {
      console.error('EventBus Bridge: Failed to unsubscribe from backend:', e);
      return false;
    }
  }

  async clearBackendHistory(): Promise<boolean> {
    if (!this.backendConnected) {
      return false;
    }

    try {
      await window.WebUIBridge.callRustFunction('event:clear_history', {});
      return true;
    } catch (e) {
      console.error('EventBus Bridge: Failed to clear backend history:', e);
      return false;
    }
  }

  forwardToBackend(eventType: string): string {
    return this.frontendBus.on(eventType, async (data) => {
      await this.publishToBackend(eventType, data);
    });
  }

  forwardFromBackend(eventType: string): string {
    if (!this.backendConnected) {
      console.warn('EventBus Bridge: Cannot forward from backend - not connected');
      return '';
    }

    return this.frontendBus.on(eventType, (data) => {
      this.frontendBus.emit(eventType, data);
    });
  }
}

const EventBridge = new EventBusBridge();

export { EventBusBridge, EventBridge };
