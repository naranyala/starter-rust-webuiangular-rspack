// frontend/src/events.ts
// Typed event definitions for the Event Bus

export interface AppEvent<T = any> {
  type: string;
  payload: T;
  timestamp: number;
  source?: string;
  target?: string;
}

export interface EventMap {
  // Application lifecycle
  'app:ready': void;
  'app:start': void;
  'app:stop': void;
  'app:error': Error;
  
  // UI Events
  'ui:button:click': { id: string; label?: string };
  'ui:button:hover': { id: string };
  'ui:modal:open': { id: string; title?: string };
  'ui:modal:close': { id: string };
  'ui:tab:change': { tabId: string; index: number };
  'ui:form:submit': { formId: string; data: Record<string, any> };
  'ui:form:validate': { formId: string; valid: boolean };
  'ui:toast:show': { message: string; type: 'info' | 'success' | 'warning' | 'error'; duration?: number };
  'ui:toast:hide': { id: string };
  
  // Data Events
  'data:fetch:start': { resource: string; params?: any };
  'data:fetch:success': { resource: string; data: any };
  'data:fetch:error': { resource: string; error: Error };
  'data:save:start': { resource: string; data: any };
  'data:save:success': { resource: string; id: string };
  'data:save:error': { resource: string; error: Error };
  'data:delete:success': { resource: string; id: string };
  
  // Navigation Events
  'nav:goto': { path: string; params?: Record<string, string> };
  'nav:back': void;
  'nav:forward': void;
  
  // Build Events
  'build:start': { target: 'frontend' | 'backend' | 'all' };
  'build:step:start': { step: string; description?: string };
  'build:step:progress': { step: string; progress: number; message?: string };
  'build:step:complete': { step: string; duration: number };
  'build:step:error': { step: string; error: Error };
  'build:complete': { success: boolean; duration: number; warnings: number };
  'build:warning': { message: string; step?: string };
  
  // Logger Events
  'log:entry': { level: string; message: string; meta?: any };
  'log:clear': void;
  'log:export': { format: 'json' | 'csv' | 'text'; filename?: string };
  
  // Window Events
  'window:resize': { width: number; height: number };
  'window:fullscreen': { enabled: boolean };
  'window:focus': void;
  'window:blur': void;
  
  // Config Events
  'config:change': { key: string; value: any; oldValue?: any };
  'config:reset': void;
  
  // Error Events
  'error:uncaught': { error: Error; context?: string };
  'error:handled': { error: Error; handled: boolean };
  
  // Custom user events
  'custom:any': any;
}

export type EventKeys = keyof EventMap;
export type EventPayload<K extends EventKeys> = EventMap[K];

export type AppEventPayload<T extends string, P = any> = {
  type: T;
  payload: P;
  timestamp: number;
  source?: string;
  target?: string;
};

export function createEvent<T extends string, P = any>(
  type: T,
  payload: P,
  source?: string,
  target?: string
): AppEventPayload<T, P> {
  return {
    type,
    payload,
    timestamp: Date.now(),
    source,
    target
  };
}

export function createTypedEvent<K extends EventKeys>(
  key: K,
  payload: EventMap[K]
): AppEvent {
  return {
    type: key,
    payload,
    timestamp: Date.now()
  };
}
