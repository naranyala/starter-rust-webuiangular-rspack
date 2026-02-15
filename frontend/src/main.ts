// Add error handling for debugging
import "./styles/app.css";
import './utils.js';
import './error-handler';
import { ErrorModal } from './error-handler';

console.log('=== Vanilla TypeScript Application Starting ===');
console.log('Current URL:', window.location.href);
console.log('Document readyState:', document.readyState);

// Initialize error modal early
const errorModal = ErrorModal.init({
  title: 'Application Error',
  maxErrors: 10,
  showStack: true,
  darkMode: true,
  onError: (error) => {
    console.error('[Global Error Handler]', error);
  },
  onClose: () => {
    console.log('Error modal closed');
  }
});

// Demo: Add a button to trigger test errors
function createDemoUI(): void {
  const buttons = [
    { label: 'Throw Uncaught Error', action: () => { throw new Error('This is an uncaught error!'); }},
    { label: 'Throw Promise Rejection', action: () => { Promise.reject(new Error('Unhandled promise rejection!')); }},
    { label: 'Trigger Network Error', action: () => { fetch('https://invalid-url-that-does-not-exist.com'); }},
    { label: 'Report Logic Error', action: () => { errorModal.report('Something went wrong in the logic', 'logic', 'UserAction:save'); }},
    { label: 'Show All Errors', action: () => { errorModal.show(); }}
  ];

  if (typeof (window as any).registerBottomPanelButtons === 'function') {
    (window as any).registerBottomPanelButtons(buttons);
    return;
  }

  const fallback = document.createElement('div');
  fallback.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    z-index: 999998;
  `;

  buttons.forEach(btn => {
    const button = document.createElement('button');
    button.textContent = btn.label;
    button.style.cssText = `
      padding: 6px 10px;
      background: #45475a;
      color: #cdd6f4;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 11px;
      transition: background 0.2s;
    `;
    button.onmouseenter = () => button.style.background = '#585b70';
    button.onmouseleave = () => button.style.background = '#45475a';
    button.onclick = btn.action;
    fallback.appendChild(button);
  });

  document.body.appendChild(fallback);
}

try {
  // Initialize the application
  import('./use-cases/App').then(App => {
    console.log('App module loaded');
    
    if (typeof App.default === 'function') {
      App.default();
      console.log('App initialized');
      
      // Create demo UI after app loads
      createDemoUI();
    } else {
      console.error('App module does not export a default function');
      errorModal.report('App module does not export a default function', 'logic');
      document.body.innerHTML = '<div style="padding: 20px; color: #f38ba8;">Error: App module does not export a default function</div>';
    }
  }).catch(error => {
    console.error('Error loading App module:', error);
    errorModal.report(`Error loading App: ${error.message}`, 'logic');
    document.body.innerHTML = `<div style="padding: 20px; color: #f38ba8;">Error loading app: ${error.message}</div>`;
  });
} catch (error: any) {
  console.error('Fatal error initializing application:', error);
  errorModal.report(`Fatal error: ${error.message}`, 'logic');
  document.body.innerHTML = `<div style="padding: 20px; color: #f38ba8;">Error: ${error.message}</div>`;
}
