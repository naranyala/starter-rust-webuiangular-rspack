// frontend/src/event-bus.ts
// Event Bus System for frontend with typed events, wildcards, and persistence

type EventCallback<T = any> = (data: T) => void;
type WildcardHandler = (event: string, data: any) => void;

interface EventSubscription {
  id: string;
  event: string;
  callback: EventCallback;
  once: boolean;
  namespace?: string;
}

interface EventHistoryEntry {
  event: string;
  data: any;
  timestamp: number;
}

class EventBus {
  private static instance: EventBus;
  private subscriptions: Map<string, Set<EventSubscription>> = new Map();
  private wildcardHandlers: Set<WildcardHandler> = new Set();
  private history: EventHistoryEntry[] = [];
  private maxHistorySize: number = 100;
  private nextId: number = 1;
  private enabled: boolean = true;
  private namespace: string = 'app';

  private constructor(maxHistorySize: number = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  static reset(): void {
    if (EventBus.instance) {
      EventBus.instance.subscriptions.clear();
      EventBus.instance.wildcardHandlers.clear();
      EventBus.instance.history = [];
      EventBus.instance = null as any;
    }
  }

  setNamespace(namespace: string): void {
    this.namespace = namespace;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private generateId(): string {
    return `${this.namespace}_${Date.now()}_${this.nextId++}`;
  }

  private addToHistory(event: string, data: any): void {
    this.history.push({ event, data, timestamp: Date.now() });
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  on<T = any>(event: string, callback: EventCallback<T>, namespace?: string): string {
    const id = this.generateId();
    const subscription: EventSubscription = {
      id,
      event,
      callback: callback as EventCallback,
      once: false,
      namespace
    };

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }
    this.subscriptions.get(event)!.add(subscription);

    return id;
  }

  once<T = any>(event: string, callback: EventCallback<T>, namespace?: string): string {
    const id = this.generateId();
    const subscription: EventSubscription = {
      id,
      event,
      callback: callback as EventCallback,
      once: true,
      namespace
    };

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }
    this.subscriptions.get(event)!.add(subscription);

    return id;
  }

  off(event?: string, callbackId?: string): void {
    if (!event && !callbackId) {
      this.subscriptions.clear();
      return;
    }

    if (event && !callbackId) {
      this.subscriptions.delete(event);
      return;
    }

    if (event && callbackId) {
      const subs = this.subscriptions.get(event);
      if (subs) {
        subs.forEach(sub => {
          if (sub.id === callbackId) {
            subs.delete(sub);
          }
        });
      }
    }
  }

  offById(callbackId: string): void {
    this.subscriptions.forEach(subs => {
      subs.forEach(sub => {
        if (sub.id === callbackId) {
          subs.delete(sub);
        }
      });
    });
  }

  emit<T = any>(event: string, data?: T, async: boolean = false): void {
    if (!this.enabled) return;

    this.addToHistory(event, data);

    const emitFn = () => {
      const subs = this.subscriptions.get(event);
      if (subs) {
        const toRemove: EventSubscription[] = [];
        
        subs.forEach(sub => {
          try {
            sub.callback(data);
            if (sub.once) {
              toRemove.push(sub);
            }
          } catch (err) {
            console.error(`EventBus error in handler for "${event}":`, err);
          }
        });

        toRemove.forEach(sub => subs.delete(sub));
      }

      this.wildcardHandlers.forEach(handler => {
        try {
          handler(event, data);
        } catch (err) {
          console.error(`EventBus wildcard handler error:`, err);
        }
      });
    };

    if (async) {
      setTimeout(emitFn, 0);
    } else {
      emitFn();
    }
  }

  emitAsync<T = any>(event: string, data?: T): Promise<void> {
    return new Promise((resolve) => {
      this.emit(event, data, true);
      setTimeout(resolve, 0);
    });
  }

  wildcard(handler: WildcardHandler): string {
    const id = this.generateId();
    this.wildcardHandlers.add(handler);
    return id;
  }

  offWildcard(handlerId?: string): void {
    if (!handlerId) {
      this.wildcardHandlers.clear();
    }
  }

  listenerCount(event?: string): number {
    if (event) {
      return this.subscriptions.get(event)?.size || 0;
    }
    let count = 0;
    this.subscriptions.forEach(subs => {
      count += subs.size;
    });
    return count;
  }

  hasListeners(event?: string): boolean {
    if (event) {
      return (this.subscriptions.get(event)?.size || 0) > 0;
    }
    return this.subscriptions.size > 0 || this.wildcardHandlers.size > 0;
  }

  getHistory(event?: string, limit?: number): EventHistoryEntry[] {
    let history = event 
      ? this.history.filter(h => h.event === event)
      : [...this.history];
    
    if (limit) {
      history = history.slice(-limit);
    }
    
    return history;
  }

  clearHistory(): void {
    this.history = [];
  }

  getSubscribers(event: string): string[] {
    const subs = this.subscriptions.get(event);
    if (!subs) return [];
    return Array.from(subs).map(s => s.id);
  }

  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
    if (this.history.length > size) {
      this.history = this.history.slice(-size);
    }
  }
}

const EventBusFactory = {
  create(maxHistorySize?: number): EventBus {
    return new EventBus(maxHistorySize);
  },
  getDefault(): EventBus {
    return EventBus.getInstance();
  }
};

export { EventBus, EventBusFactory };
export type { EventCallback, WildcardHandler, EventSubscription, EventHistoryEntry };
