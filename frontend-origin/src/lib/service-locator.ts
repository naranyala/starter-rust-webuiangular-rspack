/**
 * Service Locator - Registers all services in the DI container
 */

import { container } from './di.js';
import { SystemInfoService } from './system-info-service.js';
import { DbService } from './db-service.js';
import { WindowService } from './window-service.js';
import { UiService } from './ui-service.js';

// Register all services in the container
export function registerServices(): void {
  // Register singleton services
  container.registerSingleton('SystemInfoService', SystemInfoService);
  container.registerSingleton('DbService', DbService);
  container.registerSingleton('WindowService', WindowService);
  container.registerSingleton('UiService', UiService);
  
  // You can also register services with dependencies if needed
  // container.registerWithDependencies('SomeService', SomeServiceClass, ['Dependency1', 'Dependency2']);
}

// Initialize services
registerServices();