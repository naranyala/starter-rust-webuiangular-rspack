// Import Angular compiler synchronously (required for JIT compilation of partially compiled libraries)
import '@angular/compiler';

// Error handling wrapper at the very beginning
try {
  console.log('[MAIN] Starting Angular application bootstrap...');

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('Not running in browser environment');
  }

  // Zone.js is required for Angular change detection
  import('zone.js').then(() => {
    console.log('[MAIN] Zone.js loaded successfully');
    
    // Now import Angular modules
    return Promise.all([
      import('@angular/platform-browser'),
      import('@angular/platform-browser/animations'),
      import('@angular/router')
    ]);
  }).then(([
    { bootstrapApplication },
    { provideAnimations },
    { provideRouter }
  ]) => {
    console.log('[MAIN] Angular modules loaded');
    
    // Import app components
    return Promise.all([
      import('./app/app.component'),
      import('./app/app-routing.module')
    ]).then(([
      { AppComponent },
      { routes }
    ]) => {
      console.log('[MAIN] App components loaded, bootstrapping...');
      
      // Bootstrap the Angular application
      return bootstrapApplication(AppComponent, {
        providers: [
          provideRouter(routes),
          provideAnimations()
        ],
      });
    });
  }).then(() => {
    console.log('[MAIN] Angular application bootstrapped successfully!');
    // Hide loading indicator on success
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }).catch((err) => {
    console.error('[MAIN] Bootstrap error:', err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : 'No stack trace';
    
    // Report to global error handler if available
    if (window.reportError) {
      window.reportError('Angular Bootstrap Failed: ' + errorMsg, errorStack);
    }
    
    // Also show in console
    console.error('[MAIN] Stack trace:', errorStack);
  });
  
} catch (immediateError) {
  console.error('[MAIN] Immediate error:', immediateError);
  if (window.reportError) {
    window.reportError('Critical error at startup: ' + immediateError);
  }
}
