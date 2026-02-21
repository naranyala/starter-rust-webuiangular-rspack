export const environment = {
  production: true,
  logging: {
    enabled: true,
    minLevel: 'info' as const,
    maxEntries: 400,
    redactKeys: ['password', 'token', 'secret', 'authorization', 'cookie'],
  },
};
