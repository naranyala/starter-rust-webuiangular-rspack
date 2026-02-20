import { Injectable, signal } from '@angular/core';

export interface BusEvent<K extends string = string, P = unknown> {
  id: number;
  name: K;
  payload: P;
  timestamp: number;
}

export interface SubscribeOptions {
  once?: boolean;
  replayLast?: boolean;
}

export interface PublishOptions {
  async?: boolean;
}

type Handler<Payload> = (payload: Payload, event: BusEvent<string, Payload>) => void;
type AnyHandler = (event: BusEvent<string, unknown>) => void;

interface InternalSubscription {
  id: number;
  once: boolean;
  handler: Handler<unknown>;
}

export interface EventBusStats {
  enabled: boolean;
  listeners: number;
  anyListeners: number;
  historySize: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventBusViewModel<Events extends object> {
  private subscriptions = new Map<keyof Events & string, Map<number, InternalSubscription>>();
  private anySubscriptions = new Map<number, AnyHandler>();
  private history: Array<BusEvent<keyof Events & string, unknown>> = [];
  private nextId = 1;
  private enabled = signal(true);
  private namespace = 'app';
  private maxHistory = 300;

  readonly isEnabled = this.enabled.asReadonly();

  constructor() {}

  init(namespace: string, maxHistory: number): void {
    this.namespace = namespace;
    this.maxHistory = maxHistory;
  }

  setEnabled(enabled: boolean): void {
    this.enabled.set(enabled);
  }

  subscribe<K extends keyof Events & string>(
    name: K,
    handler: Handler<Events[K]>,
    options: SubscribeOptions = {}
  ): () => void {
    const id = this.nextId++;
    const bucket = this.subscriptions.get(name) ?? new Map<number, InternalSubscription>();
    bucket.set(id, {
      id,
      once: Boolean(options.once),
      handler: handler as Handler<unknown>,
    });
    this.subscriptions.set(name, bucket);

    if (options.replayLast) {
      const last = this.getLast(name);
      if (last) {
        try {
          handler(last.payload as Events[K], last as BusEvent<string, Events[K]>);
        } catch {
          // Silently ignore handler errors during replay
        }
      }
    }

    return () => {
      const current = this.subscriptions.get(name);
      current?.delete(id);
      if (current && current.size === 0) {
        this.subscriptions.delete(name);
      }
    };
  }

  once<K extends keyof Events & string>(name: K, handler: Handler<Events[K]>): () => void {
    return this.subscribe(name, handler, { once: true });
  }

  subscribeAny(handler: AnyHandler): () => void {
    const id = this.nextId++;
    this.anySubscriptions.set(id, handler);
    return () => {
      this.anySubscriptions.delete(id);
    };
  }

  publish<K extends keyof Events & string>(name: K, payload: Events[K], options: PublishOptions = {}): void {
    if (!this.enabled()) {
      return;
    }

    const event: BusEvent<K, Events[K]> = {
      id: this.nextId++,
      name,
      payload,
      timestamp: Date.now(),
    };

    this.pushHistory(event as BusEvent<keyof Events & string, unknown>);

    const dispatch = () => {
      const bucket = this.subscriptions.get(name);
      if (bucket) {
        for (const [id, subscription] of bucket.entries()) {
          try {
            subscription.handler(payload, event as BusEvent<string, unknown>);
          } catch {
            // Silently ignore handler errors
          }

          if (subscription.once) {
            bucket.delete(id);
          }
        }

        if (bucket.size === 0) {
          this.subscriptions.delete(name);
        }
      }

      for (const [, handler] of this.anySubscriptions) {
        try {
          handler(event as BusEvent<string, unknown>);
        } catch {
          // Silently ignore handler errors
        }
      }
    };

    if (options.async) {
      queueMicrotask(dispatch);
    } else {
      dispatch();
    }
  }

  getHistory<K extends keyof Events & string>(name?: K, limit?: number): Array<BusEvent<K, Events[K]>> {
    let data = this.history;
    if (name) {
      data = data.filter((entry) => entry.name === name);
    }

    if (typeof limit === 'number' && limit > 0) {
      data = data.slice(-limit);
    }

    return data as Array<BusEvent<K, Events[K]>>;
  }

  getLast<K extends keyof Events & string>(name: K): BusEvent<K, Events[K]> | undefined {
    for (let i = this.history.length - 1; i >= 0; i--) {
      const entry = this.history[i];
      if (entry.name === name) {
        return entry as BusEvent<K, Events[K]>;
      }
    }
    return undefined;
  }

  clearHistory(): void {
    this.history = [];
  }

  clearAllSubscriptions(): void {
    this.subscriptions.clear();
    this.anySubscriptions.clear();
  }

  stats(): EventBusStats {
    let listeners = 0;
    for (const bucket of this.subscriptions.values()) {
      listeners += bucket.size;
    }

    return {
      enabled: this.enabled(),
      listeners,
      anyListeners: this.anySubscriptions.size,
      historySize: this.history.length,
    };
  }

  private pushHistory(event: BusEvent<keyof Events & string, unknown>): void {
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }
}
