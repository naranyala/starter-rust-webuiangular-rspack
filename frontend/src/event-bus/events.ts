export interface FrontendEventMap {
  'app:ready': { timestamp: number };
  'search:updated': { query: string; length: number };
  'search:cleared': { timestamp: number };
  'ui:top-panel:toggled': { collapsed: boolean };
  'ui:bottom-panel:toggled': { collapsed: boolean };
  'window:opened': { id: string; title: string };
  'window:focused': { id: string; title?: string };
  'window:minimized': { id: string; title?: string };
  'window:restored': { id: string; title?: string };
  'window:closed': { id: string; title?: string };
  'window:home-selected': { count: number };
  'error:captured': { id: number; source: string; title: string; message: string };
}
