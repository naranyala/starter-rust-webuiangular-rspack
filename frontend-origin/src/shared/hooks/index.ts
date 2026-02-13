import { useLocalStorage, useDebounce, useAsyncOperation } from '../hooks';

export function createLocalStorageHook<T>(key: string, initialValue: T): [() => T, (value: T) => void] {
  return [() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  }, (value: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  }];
}

export function createDebounceHook<T>(value: T, delay: number, callback: (debouncedValue: T) => void): () => void {
  let timeout: NodeJS.Timeout | null = null;
  
  const updateValue = (newValue: T) => {
    value = newValue;
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => callback(value), delay);
  };

  return updateValue;
}

export async function createAsyncOperation<T>(
  asyncFunction: () => Promise<T>
): Promise<{ data: T | null; loading: boolean; error: Error | null }> {
  try {
    const result = await asyncFunction();
    return { data: result, loading: false, error: null };
  } catch (error) {
    return { data: null, loading: false, error: error as Error };
  }
}