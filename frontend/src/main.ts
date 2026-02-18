import 'zone.js';
import '@angular/compiler';
import './winbox-loader';
import { bootstrapApplication } from '@angular/platform-browser';
import { ErrorHandler } from '@angular/core';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { clearLogHistory, configureLogging, getLogHistory, getLogger } from './logging/logger';
import { GlobalErrorHandler } from './error/global-error.handler';
import { GlobalErrorService } from './error/global-error.service';
import { appEventBus } from './event-bus';

configureLogging(environment.logging);
const logger = getLogger('bootstrap');
const debugApiWindow = window as Window & {
  __FRONTEND_LOGS__?: { getHistory: typeof getLogHistory; clear: typeof clearLogHistory };
  __FRONTEND_EVENT_BUS__?: typeof appEventBus;
};
debugApiWindow.__FRONTEND_LOGS__ = {
  getHistory: getLogHistory,
  clear: clearLogHistory,
};
debugApiWindow.__FRONTEND_EVENT_BUS__ = appEventBus;

const globalFlag = '__frontendGlobalErrorHooks';
const globalWindow = window as Window & { [globalFlag]?: boolean };

try {
  logger.info('Starting Angular bootstrap', { production: environment.production });
  bootstrapApplication(AppComponent, {
    providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }],
  })
    .then((appRef) => {
      const globalErrorService = appRef.injector.get(GlobalErrorService);
      if (!globalWindow[globalFlag]) {
        window.addEventListener('error', (event) => {
          event.preventDefault();
          globalErrorService.report(event.error ?? event.message, {
            source: 'window',
            details: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined,
          });
        });

        window.addEventListener('unhandledrejection', (event) => {
          event.preventDefault();
          globalErrorService.report(event.reason, {
            source: 'promise',
            title: 'Unhandled Promise Rejection',
          });
        });

        globalWindow[globalFlag] = true;
      }
      appEventBus.publish('app:ready', { timestamp: Date.now() });
      logger.info('Angular bootstrap completed');
    })
    .catch((err) => {
      logger.error('Angular bootstrap failed', {}, err);
      document.body.innerHTML = `<h1 style="color:red;">Error: ${err.message}</h1>`;
    });
} catch (err: any) {
  logger.error('Bootstrap threw synchronously', {}, err);
  document.body.innerHTML = `<h1 style="color:red;">Error: ${err.message}</h1>`;
}
