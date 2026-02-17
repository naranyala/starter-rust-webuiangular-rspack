// core/frontend/src/core/plugin.ts
/**
 * Plugin System
 * 
 * Frontend plugin architecture
 */

import { EventBus } from './events';
import { BaseViewModel } from './viewmodel';

/**
 * Plugin context
 */
export interface PluginContext {
  pluginId: string;
  eventBus: EventBus;
  registerViewModel: (name: string, vm: BaseViewModel) => void;
  registerComponent: (name: string, component: any) => void;
  getConfig: <T>(key: string) => T | undefined;
  setConfig: (key: string, value: any) => void;
  log: (level: string, message: string) => void;
}

/**
 * Plugin interface
 */
export interface IPlugin {
  name: string;
  version: string;
  description?: string;
  
  initialize(ctx: PluginContext): Promise<void>;
  dispose(): Promise<void>;
  getComponents(): any[];
}

/**
 * Base plugin class
 */
export abstract class BasePlugin implements IPlugin {
  name: string = '';
  version: string = '1.0.0';
  description?: string;
  
  protected ctx?: PluginContext;
  
  abstract initialize(ctx: PluginContext): Promise<void>;
  
  async dispose(): Promise<void> {
    // Override in subclass
  }
  
  getComponents(): any[] {
    return [];
  }
  
  protected log(level: string, message: string): void {
    this.ctx?.log(level, message);
  }
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  dependencies?: string[];
}

/**
 * Plugin manager
 */
export class PluginManager {
  private plugins: Map<string, IPlugin> = new Map();
  private viewModels: Map<string, BaseViewModel> = new Map();
  private components: Map<string, any> = new Map();
  
  /**
   * Register a plugin
   */
  async register(plugin: IPlugin): Promise<void> {
    const ctx: PluginContext = {
      pluginId: plugin.name,
      eventBus: EventBus.getInstance(),
      registerViewModel: (name, vm) => {
        this.viewModels.set(`${plugin.name}:${name}`, vm);
      },
      registerComponent: (name, component) => {
        this.components.set(`${plugin.name}:${name}`, component);
      },
      getConfig: (key) => {
        const item = localStorage.getItem(`plugin:${plugin.name}:${key}`);
        return item ? JSON.parse(item) : undefined;
      },
      setConfig: (key, value) => {
        localStorage.setItem(`plugin:${plugin.name}:${key}`, JSON.stringify(value));
      },
      log: (level, message) => {
        console.log(`[Plugin:${plugin.name}] ${level.toUpperCase()}: ${message}`);
      }
    };
    
    await plugin.initialize(ctx);
    this.plugins.set(plugin.name, plugin);
    
    console.log(`[PluginManager] Registered plugin: ${plugin.name} v${plugin.version}`);
  }
  
  /**
   * Get a plugin
   */
  getPlugin(name: string): IPlugin | undefined {
    return this.plugins.get(name);
  }
  
  /**
   * Get a ViewModel
   */
  getViewModel(name: string): BaseViewModel | undefined {
    return this.viewModels.get(name);
  }
  
  /**
   * Get a component
   */
  getComponent(name: string): any {
    return this.components.get(name);
  }
  
  /**
   * List all plugins
   */
  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }
}
