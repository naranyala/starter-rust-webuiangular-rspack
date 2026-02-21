// src/core/plugins/plugin.interface.ts
// Plugin system interfaces

import { Type } from '@angular/core';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
}

export interface Plugin {
  readonly manifest: PluginManifest;
  
  initialize(): Promise<void> | void;
  
  destroy(): Promise<void> | void;
}

export interface PluginHook {
  onPluginRegistered(plugin: Plugin): void;
  onPluginInitialized(plugin: Plugin): void;
  onPluginDestroyed(plugin: Plugin): void;
}

export interface PluginModule {
  plugin: Type<Plugin>;
}

export enum PluginState {
  Registered = 'registered',
  Initializing = 'initializing',
  Active = 'active',
  Failed = 'failed',
  Destroyed = 'destroyed'
}

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  state: PluginState;
  error?: string;
}
