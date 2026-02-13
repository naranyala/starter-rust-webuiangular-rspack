import { SystemInfoService } from '../services/system/system-info-service';
import { logger } from '../../shared/utils/logger';

export class SystemInfoComponent {
  private container: HTMLElement;
  private systemInfoService: SystemInfoService;
  private systemInfoData: any = null;
  private browserInfoData: any = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.systemInfoService = new SystemInfoService();
    this.init();
  }

  private async init(): Promise<void> {
    logger.info('SystemInfo component initialized');
    await this.loadSystemInfo();
    this.loadBrowserInfo();
    this.render();
  }

  private async loadSystemInfo(): Promise<void> {
    try {
      this.systemInfoData = await this.systemInfoService.getSystemInfo();
      logger.info('System info loaded:', this.systemInfoData);
    } catch (error) {
      logger.error('Error loading system info:', error);
    }
  }

  private loadBrowserInfo(): void {
    this.browserInfoData = this.systemInfoService.getBrowserInfo();
  }

  private render(): void {
    if (this.systemInfoData?.data || this.browserInfoData) {
      this.container.innerHTML = this.getTemplate();
      this.attachEventListeners();
    } else {
      this.container.innerHTML = '<div class="error">Failed to load system information</div>';
    }
  }

  private getTemplate(): string {
    return `
      <div class="system-info">
        <h2>System Information</h2>
        
        ${this.systemInfoData?.data ? this.getSystemInfoTemplate() : ''}
        ${this.browserInfoData ? this.getBrowserInfoTemplate() : ''}
      </div>
    `;
  }

  private getSystemInfoTemplate(): string {
    const data = this.systemInfoData.data;
    return `
      <div class="system-data">
        <h3>Operating System</h3>
        <p>Platform: ${data.os?.platform || 'N/A'}</p>
        <p>Architecture: ${data.os?.arch || 'N/A'}</p>
        
        <h3>Memory</h3>
        <p>Total: ${data.memory?.total_mb?.toFixed(2) || 'N/A'} MB</p>
        <p>Free: ${data.memory?.free_mb?.toFixed(2) || 'N/A'} MB</p>
        
        <h3>CPU</h3>
        <p>Cores: ${data.cpu?.cores || 'N/A'}</p>
        <p>Usage: ${data.cpu?.usage_percent?.toFixed(2) || 'N/A'}%</p>
        
        <h3>Uptime</h3>
        <p>${data.uptime || 'N/A'}</p>
      </div>
    `;
  }

  private getBrowserInfoTemplate(): string {
    return `
      <div class="browser-data">
        <h3>Browser Information</h3>
        <p>User Agent: ${this.browserInfoData.userAgent || 'N/A'}</p>
        <p>Language: ${this.browserInfoData.language || 'N/A'}</p>
        <p>Platform: ${this.browserInfoData.platform || 'N/A'}</p>
        <p>Online: ${this.browserInfoData.onLine ? 'Yes' : 'No'}</p>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Add any event listeners here
  }

  public destroy(): void {
    this.container.innerHTML = '';
    logger.info('SystemInfo component destroyed');
  }
}