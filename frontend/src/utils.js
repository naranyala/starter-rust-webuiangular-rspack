// frontend/src/utils.js
// Enhanced frontend logging service with persistence, export, and backend integration

const LOG_STORAGE_KEY = 'app_logs';
const LOG_DB_NAME = 'AppLogsDB';
const LOG_STORE_NAME = 'logs';

class EnhancedLogger {
  constructor() {
    this.logs = [];
    this.maxLogEntries = 1000;
    this.logLevel = 'INFO';
    this.logLevels = { 'TRACE': 0, 'DEBUG': 1, 'INFO': 2, 'WARN': 3, 'ERROR': 4 };
    this.listeners = new Map();
    this.category = 'app';
    this.sessionId = this.generateSessionId();
    this.db = null;
    this.initDB();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async initDB() {
    if (!this.isIndexedDBAvailable()) return;
    
    return new Promise((resolve) => {
      const request = indexedDB.open(LOG_DB_NAME, 1);
      
      request.onerror = () => resolve(null);
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.loadFromDB();
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(LOG_STORE_NAME)) {
          const store = db.createObjectStore(LOG_STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('level', 'level', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }
      };
    });
  }

  isIndexedDBAvailable() {
    return typeof indexedDB !== 'undefined';
  }

  async loadFromDB() {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([LOG_STORE_NAME], 'readonly');
        const store = transaction.objectStore(LOG_STORE_NAME);
        const request = store.index('timestamp').openCursor(null, 'prev');
        
        const logs = [];
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor && logs.length < this.maxLogEntries) {
            logs.push(cursor.value);
            cursor.continue();
          } else {
            this.logs = logs.reverse();
            resolve();
          }
        };
      } catch {
        resolve();
      }
    });
  }

  async saveToDB(entry) {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([LOG_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(LOG_STORE_NAME);
        store.put(entry);
        
        this.cleanupOldLogs();
        resolve();
      } catch {
        resolve();
      }
    });
  }

  async cleanupOldLogs() {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([LOG_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(LOG_STORE_NAME);
        const countRequest = store.count();
        
        countRequest.onsuccess = () => {
          if (countRequest.result > this.maxLogEntries * 2) {
            const index = store.index('timestamp');
            const cursorRequest = index.openCursor();
            let deleted = 0;
            const toDelete = countRequest.result - this.maxLogEntries;
            
            cursorRequest.onsuccess = (event) => {
              const cursor = event.target.result;
              if (cursor && deleted < toDelete) {
                store.delete(cursor.primaryKey);
                deleted++;
                cursor.continue();
              }
            };
          }
          resolve();
        };
      } catch {
        resolve();
      }
    });
  }

  shouldLog(level) {
    return this.logLevels[level] >= this.logLevels[this.logLevel];
  }

  addLog(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      level,
      message,
      meta,
      category: this.category,
      sessionId: this.sessionId
    };

    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    this.outputToConsole(logEntry);
    this.emitLogEvent(logEntry);
    this.notifyListeners(logEntry);
    this.saveToDB(logEntry);
  }

  outputToConsole(entry) {
    const { level, message, timestamp, category } = entry;
    const prefix = `[${timestamp}] [${level}] [${category}]`;
    
    const style = this.getConsoleStyle(level);
    if (style) {
      console.log(`%c${prefix} ${message}`, style);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  getConsoleStyle(level) {
    const styles = {
      'ERROR': 'color: #ff4444; font-weight: bold;',
      'WARN': 'color: #ffaa00; font-weight: bold;',
      'INFO': 'color: #44ff44;',
      'DEBUG': 'color: #4488ff;',
      'TRACE': 'color: #888888;'
    };
    return styles[level];
  }

  emitLogEvent(entry) {
    window.dispatchEvent(new CustomEvent('logEntryAdded', { detail: entry }));
  }

  notifyListeners(entry) {
    this.listeners.forEach((callback, id) => {
      try {
        callback(entry);
      } catch (e) {
        console.error('Log listener error:', e);
      }
    });
  }

  addListener(id, callback) {
    this.listeners.set(id, callback);
  }

  removeListener(id) {
    this.listeners.delete(id);
  }

  trace(message, meta = {}) { this.addLog('TRACE', message, meta); }
  debug(message, meta = {}) { this.addLog('DEBUG', message, meta); }
  info(message, meta = {}) { this.addLog('INFO', message, meta); }
  warn(message, meta = {}) { this.addLog('WARN', message, meta); }
  error(message, meta = {}) { this.addLog('ERROR', message, meta); }

  getLogs(filters = {}) {
    let result = [...this.logs];
    
    if (filters.level) {
      const minLevel = this.logLevels[filters.level];
      result = result.filter(l => this.logLevels[l.level] >= minLevel);
    }
    if (filters.category) {
      result = result.filter(l => l.category === filters.category);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(l => 
        l.message.toLowerCase().includes(search) ||
        JSON.stringify(l.meta).toLowerCase().includes(search)
      );
    }
    if (filters.since) {
      result = result.filter(l => new Date(l.timestamp) > new Date(filters.since));
    }
    
    return result;
  }

  clearLogs() {
    this.logs = [];
    window.dispatchEvent(new CustomEvent('logsCleared'));
    this.clearDB();
  }

  async clearDB() {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([LOG_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(LOG_STORE_NAME);
        store.clear();
        resolve();
      } catch {
        resolve();
      }
    });
  }

  setLogLevel(level) {
    if (this.logLevels.hasOwnProperty(level.toUpperCase())) {
      this.logLevel = level.toUpperCase();
      this.info(`Log level set to ${this.logLevel}`, { component: 'Logger' });
    }
  }

  getLogLevel() {
    return this.logLevel;
  }

  setCategory(category) {
    this.category = category;
  }

  getStats() {
    const stats = { total: this.logs.length };
    Object.keys(this.logLevels).forEach(level => {
      stats[level.toLowerCase()] = this.logs.filter(l => l.level === level).length;
    });
    return stats;
  }

  exportLogs(format = 'json') {
    const logs = this.getLogs();
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }
    
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'message', 'meta'];
      const rows = logs.map(l => [
        l.timestamp,
        l.level,
        l.category,
        `"${l.message.replace(/"/g, '""')}"`,
        `"${JSON.stringify(l.meta).replace(/"/g, '""')}"`
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
    
    if (format === 'text') {
      return logs.map(l => 
        `[${l.timestamp}] [${l.level}] [${l.category}] ${l.message} ${JSON.stringify(l.meta)}`
      ).join('\n');
    }
    
    return '';
  }

  downloadLogs(format = 'json', filename = 'app-logs') {
    const content = this.exportLogs(format);
    const mimeTypes = {
      json: 'application/json',
      csv: 'text/csv',
      text: 'text/plain'
    };
    
    const blob = new Blob([content], { type: mimeTypes[format] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.info(`Logs exported as ${format}`, { format, filename });
  }

  async sendToBackend(message, level = 'INFO', meta = {}) {
    if (window.WebUIBridge?.callRustFunction) {
      try {
        await window.WebUIBridge.callRustFunction('log_message', {
          message,
          level,
          meta,
          category: this.category,
          sessionId: this.sessionId,
          frontendTimestamp: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Failed to send log to backend:', e);
      }
    }
  }
}

class BuildLogger {
  constructor(logger) {
    this.logger = logger;
    this.steps = [];
    this.currentStep = null;
    this.startTime = null;
  }

  startBuild(platform = 'frontend') {
    this.startTime = Date.now();
    this.logger.info(`Starting ${platform} build`, { platform, timestamp: new Date().toISOString() });
  }

  startStep(name, description = '') {
    const step = {
      name,
      description,
      startTime: Date.now(),
      status: 'running',
      logs: []
    };
    this.currentStep = step;
    this.steps.push(step);
    this.logger.debug(`Starting step: ${name}`, { step: name, description });
  }

  stepLog(message, level = 'info') {
    if (this.currentStep) {
      this.currentStep.logs.push({ message, level, timestamp: Date.now() });
      this.logger[level](`[${this.currentStep.name}] ${message}`);
    }
  }

  endStep(success = true, error = null) {
    if (this.currentStep) {
      this.currentStep.endTime = Date.now();
      this.currentStep.duration = this.currentStep.endTime - this.currentStep.startTime;
      this.currentStep.status = success ? 'success' : 'error';
      this.currentStep.error = error;
      
      const status = success ? 'completed' : 'failed';
      this.logger.info(`Step ${this.currentStep.name} ${status}`, {
        step: this.currentStep.name,
        duration: this.currentStep.duration,
        success
      });
      
      this.currentStep = null;
    }
  }

  endBuild(success = true, error = null) {
    const totalDuration = Date.now() - this.startTime;
    const summary = {
      totalDuration,
      totalSteps: this.steps.length,
      successfulSteps: this.steps.filter(s => s.status === 'success').length,
      failedSteps: this.steps.filter(s => this.steps.status === 'error').length,
      steps: this.steps.map(s => ({
        name: s.name,
        duration: s.duration,
        status: s.status
      }))
    };

    if (success) {
      this.logger.info(`Build completed successfully`, summary);
    } else {
      this.logger.error(`Build failed`, { ...summary, error: error?.message });
    }

    return summary;
  }

  getSteps() {
    return this.steps;
  }

  getSummary() {
    return {
      totalSteps: this.steps.length,
      completed: this.steps.filter(s => s.status === 'success').length,
      failed: this.steps.filter(s => s.status === 'error').length,
      inProgress: this.steps.filter(s => s.status === 'running').length,
      totalDuration: this.steps.reduce((acc, s) => acc + (s.duration || 0), 0)
    };
  }
}

class WebUIBridge {
  constructor() {
    this.callbacks = new Map();
    this.nextId = 1;
    this.logger = window.Logger || new EnhancedLogger();
  }

  callRustFunction(funcName, data = null) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.callbacks.set(id, { resolve, reject });

      this.logger.debug(`Calling Rust: ${funcName}`, {
        functionName: funcName,
        data,
        callId: id
      });

      try {
        if (window.__webui__) {
          window.__webui__.call(funcName, JSON.stringify(data || {})).then(result => {
            this.logger.debug(`Rust function success: ${funcName}`, { functionName: funcName, result });
            resolve(JSON.parse(result));
          }).catch(error => {
            this.logger.error(`Rust function error: ${funcName}`, {
              functionName: funcName,
              error: error.message,
              data
            });
            reject(error);
          });
        } else {
          this.logger.warn('WebUI not available, using mock');
          resolve(this.getMockResponse(funcName, data));
        }
      } catch (error) {
        this.logger.error(`Exception calling ${funcName}`, { functionName: funcName, error: error.message });
        reject(error);
      }
    });
  }

  getMockResponse(funcName, data) {
    const mocks = {
      'open_folder': { success: true, path: '/home/user/images', images: [] },
      'organize_images': { success: true, message: 'Images organized' },
      'increment_counter': { success: true, value: data?.value || 0 },
      'reset_counter': { success: true, value: 0 },
      'log_message': { success: true, logged: true }
    };
    return mocks[funcName] || { success: true };
  }

  handleResponse(response) {
    this.logger.debug('Received from Rust', { response });
  }
}

window.Logger = new EnhancedLogger();
window.BuildLogger = new BuildLogger(window.Logger);
window.WebUIBridge = new WebUIBridge();

export { EnhancedLogger, BuildLogger, WebUIBridge };
