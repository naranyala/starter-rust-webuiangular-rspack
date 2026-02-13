import './lib/index';
import App from './App';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await App.init();
});
