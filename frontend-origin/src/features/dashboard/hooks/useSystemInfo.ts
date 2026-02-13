import { SystemInfoService } from '../../services/system/system-info-service';
import { createAsyncOperation } from '../../../shared/hooks';

export function useSystemInfo() {
  const systemInfoService = new SystemInfoService();
  
  return createAsyncOperation(() => systemInfoService.getSystemInfo());
}

export function useBrowserInfo() {
  const systemInfoService = new SystemInfoService();
  
  return {
    data: systemInfoService.getBrowserInfo(),
    loading: false,
    error: null,
  };
}