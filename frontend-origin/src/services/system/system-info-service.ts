import { ISystemInfoService } from '../shared/types/services';

export class SystemInfoService implements ISystemInfoService {
  async getSystemInfo(): Promise<any> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.webui) {
        window.webui.call('get_system_info', (response: any) => {
          resolve(response);
        });
      } else {
        resolve({ error: 'WebUI not available' });
      }
    });
  }

  getBrowserInfo(): any {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
    };
  }

  getDisplayInfo(): any {
    return {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
    };
  }
}