declare module '*.js' {
  const value: {
    info: (message: string, data?: unknown) => void;
    warn: (message: string, data?: unknown) => void;
    error: (message: string, data?: unknown) => void;
    debug: (message: string, data?: unknown) => void;
  };
  export default value;
}
