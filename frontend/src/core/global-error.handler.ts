import { ErrorHandler, Injector, inject } from '@angular/core';
import { GlobalErrorService } from './global-error.service';

export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  handleError(error: unknown): void {
    const errorService = this.injector.get(GlobalErrorService);
    errorService.report(error, { source: 'angular' });
  }
}
