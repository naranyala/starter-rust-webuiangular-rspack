import 'zone.js';
import '@angular/compiler';
import './winbox-loader';
import { bootstrapApplication } from '@angular/platform-browser';
import { ErrorHandler } from '@angular/core';
import { AppComponent } from './views/app.component';
import { environment } from './environments/environment';
import { clearLogHistory, configureLogging, getLogHistory, getLogger, backend } from './viewmodels/logger';
import { GlobalErrorHandler } from './core/global-error.handler';
import { EventBusViewModel } from './viewmodels/event-bus.viewmodel';
import { GlobalErrorService } from './core/global-error.service';

const eventBus = new EventBusViewModel<Record<string, unknown>>();
eventBus.init('app', 300);

configureLogging(environment.logging);
backend.enableBackendSink();
const logger = getLogger('bootstrap');

const debugApiWindow = window as unknown as {
  __FRONTEND_LOGS__?: { getHistory: typeof getLogHistory; clear: typeof clearLogHistory };
  __FRONTEND_EVENT_BUS__?: EventBusViewModel<Record<string, unknown>>;
};
debugApiWindow.__FRONTEND_LOGS__ = { getHistory: getLogHistory, clear: clearLogHistory };
debugApiWindow.__FRONTEND_EVENT_BUS__ = eventBus;

const globalFlag = '__frontendGlobalErrorHooks';
const globalWindow = window as unknown as { [key: string]: unknown };

try {
  logger.info('Starting Angular bootstrap', { production: environment.production });
  bootstrapApplication(AppComponent, {
    providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }],
  })
    .then((appRef) => {
      if (!globalWindow[globalFlag]) {
        window.addEventListener('error', (event) => {
          event.preventDefault();
          const errorService = appRef.injector.get(GlobalErrorService);
          errorService.report(event.error ?? event.message, { source: 'window' });
        });

        window.addEventListener('unhandledrejection', (event) => {
          event.preventDefault();
          const errorService = appRef.injector.get(GlobalErrorService);
          errorService.report(event.reason, { source: 'promise', title: 'Unhandled Promise Rejection' });
        });

        globalWindow[globalFlag] = true;
      }
      eventBus.publish('app:ready', { timestamp: Date.now() });
      logger.info('Angular bootstrap completed');
    })
    .catch((err) => {
      logger.error('Angular bootstrap failed', {}, err);
      document.body.innerHTML = `<h1 style="color:red;">Error: ${err.message}</h1>`;
    });
} catch (err: unknown) {
  logger.error('Bootstrap threw synchronously', {}, err);
  document.body.innerHTML = `<h1 style="color:red;">Error: ${(err as Error).message}</h1>`;
}
