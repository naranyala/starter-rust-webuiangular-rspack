// src/core/plugins/plugin-registry.ts
// Plugin Registry - manages all plugins

import { Injectable, Type } from '@angular/core';
import { Plugin, PluginHook, PluginInfo, PluginManifest, PluginModule, PluginState } from './plugin.interface';
import { Result, ok, err, createError, ErrorCode } from '../errors';

@Injectable({
  providedIn: 'root'
})
export class PluginRegistry {
  private plugins = new Map<string, Plugin>();
  private hooks: PluginHook[] = [];
  
  register(manifest: PluginManifest, pluginClass: Type<Plugin>): Result<void> {
    if (this.plugins.has(manifest.id)) {
      console.warn(`Plugin ${manifest.id} already registered`);
      return ok(undefined);
    }
    
    const plugin = new pluginClass();
    this.plugins.set(manifest.id, plugin);
    
    this.hooks.forEach(hook => hook.onPluginRegistered(plugin));
    return ok(undefined);
  }
  
  async initializePlugin(id: string): Promise<Result<void>> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      return err(createError(ErrorCode.NOT_FOUND, `Plugin ${id} not found`));
    }
    
    try {
      this.hooks.forEach(hook => hook.onPluginInitialized(plugin));
      await plugin.initialize();
      return ok(undefined);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`Failed to initialize plugin ${id}:`, error);
      return err(createError(ErrorCode.PLUGIN, `Failed to initialize plugin ${id}: ${errMsg}`, error));
    }
  }
  
  async initializeAll(): Promise<Result<void>> {
    const results = await Promise.all(
      Array.from(this.plugins.keys()).map(id => 
        this.initializePlugin(id).catch(error => {
          console.error(`Plugin ${id} initialization failed:`, error);
          return err(createError(ErrorCode.PLUGIN, `Plugin ${id} initialization failed: ${error}`));
        })
      )
    );
    
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      return err(createError(ErrorCode.PLUGIN, `${failures.length} plugin(s) failed to initialize`));
    }
    return ok(undefined);
  }
  
  async destroyPlugin(id: string): Promise<Result<void>> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      return ok(undefined);
    }
    
    try {
      await plugin.destroy();
      this.hooks.forEach(hook => hook.onPluginDestroyed(plugin));
      return ok(undefined);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return err(createError(ErrorCode.PLUGIN, `Failed to destroy plugin ${id}: ${errMsg}`, error));
    }
  }
  
  getPlugin(id: string): Result<Plugin> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      return err(createError(ErrorCode.NOT_FOUND, `Plugin ${id} not found`));
    }
    return ok(plugin);
  }
  
  listPlugins(): PluginInfo[] {
    return Array.from(this.plugins.entries()).map(([id, plugin]) => ({
      id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      state: PluginState.Active
    }));
  }
  
  addHook(hook: PluginHook): void {
    this.hooks.push(hook);
  }
  
  removeHook(hook: PluginHook): void {
    const index = this.hooks.indexOf(hook);
    if (index > -1) {
      this.hooks.splice(index, 1);
    }
  }
}
