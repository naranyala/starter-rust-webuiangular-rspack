import { ErrorHandler, Injectable, inject } from '@angular/core';
import { getLogger } from '../logging/logger';
import { GlobalErrorService } from './global-error.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = getLogger('error.handler');
  private readonly globalErrorService = inject(GlobalErrorService);

  handleError(error: unknown): void {
    this.logger.error('Unhandled Angular error', {}, error);
    this.globalErrorService.report(error, { source: 'angular' });
  }
}
