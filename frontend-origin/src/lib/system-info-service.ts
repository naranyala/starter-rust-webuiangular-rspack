/**
 * System Information Service Implementation
 */

import { ISystemInfoService } from './services.js';

export class SystemInfoService implements ISystemInfoService {
  async getSystemInfo(): Promise<any> {
    return {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      pixelRatio: window.devicePixelRatio,
      currentTime: new Date().toISOString(),
    };
  }

  getBrowserInfo(): any {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      onLine: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      hardwareConcurrency: navigator.hardwareConcurrency,
    };
  }

  getDisplayInfo(): any {
    return {
      screenWidth: screen.width,
      screenHeight: screen.height,
      availableWidth: screen.availWidth,
      availableHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
    };
  }
}