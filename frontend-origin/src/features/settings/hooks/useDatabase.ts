import { DbService } from '../../../services/api/db-service';
import { createAsyncOperation } from '../../../shared/hooks';

export function useUsers() {
  const dbService = new DbService();
  
  return createAsyncOperation(() => dbService.getUsers());
}

export function useDbStats() {
  const dbService = new DbService();
  
  return createAsyncOperation(() => dbService.getStats());
}