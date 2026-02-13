// Add error handling for debugging
console.log('=== Vanilla TypeScript Application Starting ===');
console.log('Current URL:', window.location.href);
console.log('Document readyState:', document.readyState);

try {
  // Initialize the application
  import('./use-cases/App').then(App => {
    console.log('App module loaded');
    
    if (typeof App.default === 'function') {
      App.default();
      console.log('App initialized');
    } else {
      console.error('App module does not export a default function');
      document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: App module does not export a default function</div>';
    }
  }).catch(error => {
    console.error('Error loading App module:', error);
    document.body.innerHTML = `<div style="padding: 20px; color: red;">Error loading app: ${error.message}</div>`;
  });
} catch (error) {
  console.error('Fatal error initializing application:', error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error.message}</div>`;
}

// Global error handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('Global error:', msg, 'at', url, lineNo, columnNo, error);
  return false;
};

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
});