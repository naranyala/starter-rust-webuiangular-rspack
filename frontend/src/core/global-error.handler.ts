import { ErrorHandler, Injector, inject } from '@angular/core';
import { GlobalErrorService } from './global-error.service';
import { ErrorValue, ErrorCode } from '../types/error.types';

export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  handleError(error: unknown): void {
    const errorService = this.injector.get(GlobalErrorService);
    
    // Convert unknown error to ErrorValue
    const errorValue: ErrorValue = error instanceof Error 
      ? {
          code: ErrorCode.InternalError,
          message: error.message,
          details: error.stack,
        }
      : {
          code: ErrorCode.Unknown,
          message: typeof error === 'string' ? error : 'An unknown error occurred',
        };
    
    errorService.report(errorValue, { source: 'angular' });
  }
}
