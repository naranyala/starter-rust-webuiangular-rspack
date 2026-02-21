// WinBox loads itself onto window.WinBox via side-effect import
import 'winbox';
import { getLogger } from './viewmodels/logger';

const logger = getLogger('winbox');

// Verify WinBox is available on window
if (typeof window !== 'undefined' && (window as any).WinBox) {
  logger.debug('WinBox loaded and available on window.WinBox');
} else {
  logger.warn('WinBox was imported but not found on window object');
}
