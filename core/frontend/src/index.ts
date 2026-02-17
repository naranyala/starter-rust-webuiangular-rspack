// core/frontend/src/index.ts
/**
 * Rust WebUI Core Frontend Library
 * 
 * Provides the foundation for plugin-driven MVVM architecture
 */

export * from './core/models';
export * from './core/viewmodel';
export * from './core/events';
export * from './core/plugin';
export * from './core/service';

/**
 * Core library version
 */
export const VERSION = '1.0.0';

/**
 * Initialize core system
 */
export function init(): void {
  console.log(`[Core] Rust WebUI Frontend Core v${VERSION} initialized`);
}
