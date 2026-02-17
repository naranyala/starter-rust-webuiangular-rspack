// core/frontend/src/core/events.ts
/**
 * Event Bus
 * 
 * Pub/Sub system for communication between components
 */

export type EventHandler = (payload: any) => void;

/**
 * Event Bus for pub/sub messaging
 */
export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  /**
   * Subscribe to an event
   */
  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    
    this.handlers.get(eventType)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }
  
  /**
   * Publish an event
   */
  publish(eventType: string, payload: any): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[EventBus] Error in handler for ${eventType}:`, error);
        }
      });
    }
  }
  
  /**
   * Clear all handlers for an event
   */
  clear(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }
}

/**
 * Application event
 */
export interface AppEvent {
  type: string;
  payload: any;
  source?: string;
  timestamp: number;
}

/**
 * Create an app event
 */
export function createEvent(type: string, payload: any, source?: string): AppEvent {
  return {
    type,
    payload,
    source,
    timestamp: Date.now()
  };
}
