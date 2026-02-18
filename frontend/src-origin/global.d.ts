// Type declarations for global error handling
declare global {
  interface Window {
    reportError?: (msg: string, details?: string) => void;
    Zone?: any;
    bootstrapApplication?: any;
    ng?: any;
  }
}

export {};
