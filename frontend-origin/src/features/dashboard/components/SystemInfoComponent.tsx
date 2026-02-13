import React from 'react';
import { useSystemInfo, useBrowserInfo } from '../hooks/useSystemInfo';
import { logger } from '../../../shared/utils/logger';

export const SystemInfoComponent: React.FC = () => {
  const { data: systemInfo, loading, error } = useSystemInfo();
  const { data: browserInfo } = useBrowserInfo();

  React.useEffect(() => {
    logger.info('SystemInfo component mounted');
    return () => {
      logger.info('SystemInfo component unmounted');
    };
  }, []);

  if (loading) return <div>Loading system information...</div>;
  if (error) return <div>Error loading system info: {error.message}</div>;

  return (
    <div className="system-info">
      <h2>System Information</h2>
      
      {systemInfo?.data && (
        <div className="system-data">
          <h3>Operating System</h3>
          <p>Platform: {systemInfo.data.os?.platform}</p>
          <p>Architecture: {systemInfo.data.os?.arch}</p>
          
          <h3>Memory</h3>
          <p>Total: {systemInfo.data.memory?.total_mb?.toFixed(2)} MB</p>
          <p>Free: {systemInfo.data.memory?.free_mb?.toFixed(2)} MB</p>
          
          <h3>CPU</h3>
          <p>Cores: {systemInfo.data.cpu?.cores}</p>
          <p>Usage: {systemInfo.data.cpu?.usage_percent?.toFixed(2)}%</p>
          
          <h3>Uptime</h3>
          <p>{systemInfo.data.uptime}</p>
        </div>
      )}
      
      {browserInfo && (
        <div className="browser-data">
          <h3>Browser Information</h3>
          <p>User Agent: {browserInfo.userAgent}</p>
          <p>Language: {browserInfo.language}</p>
          <p>Platform: {browserInfo.platform}</p>
          <p>Online: {browserInfo.onLine ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};