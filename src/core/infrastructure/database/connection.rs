// src/core/infrastructure/database/connection.rs
// Database connection management with connection pooling

use log::{error, info};
use r2d2::{Pool, PooledConnection};
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::{Connection, Result as SqliteResult, ToSql};
use std::time::Duration;

use crate::core::error::{AppResult, ErrorValue, ErrorCode, AppError};

use super::models::QueryResult;

/// Connection pool configuration
pub struct DbPoolConfig {
    pub max_size: u32,
    pub min_size: u32,
    pub connection_timeout: Duration,
    pub idle_timeout: Option<Duration>,
}

impl Default for DbPoolConfig {
    fn default() -> Self {
        Self {
            max_size: 10,
            min_size: 2,
            connection_timeout: Duration::from_secs(30),
            idle_timeout: Some(Duration::from_secs(600)),
        }
    }
}

/// Database with connection pooling
pub struct Database {
    pool: Pool<SqliteConnectionManager>,
    #[allow(dead_code)]
    config: DbPoolConfig,
}

impl Database {
    /// Create a new database with connection pooling
    pub fn new(db_path: &str) -> AppResult<Self> {
        Self::with_config(db_path, DbPoolConfig::default())
    }

    /// Create database with custom configuration
    pub fn with_config(db_path: &str, config: DbPoolConfig) -> AppResult<Self> {
        info!(
            "Initializing database connection pool: max={}, min={}, timeout={:?}s",
            config.max_size,
            config.min_size,
            config.connection_timeout.as_secs()
        );

        // Configure SQLite connection manager
        let manager = SqliteConnectionManager::file(db_path);

        // Build connection pool
        let pool = Pool::builder()
            .max_size(config.max_size)
            .min_idle(Some(config.min_size))
            .connection_timeout(config.connection_timeout)
            .idle_timeout(config.idle_timeout)
            .build(manager)
            .map_err(|e: r2d2::Error| {
                AppError::Database(
                    ErrorValue::new(
                        ErrorCode::DbConnectionFailed,
                        "Failed to create database connection pool"
                    )
                    .with_cause(e.to_string())
                    .with_context("db_path", db_path.to_string())
                )
            })?;

        info!("Database connection pool created successfully: {}", db_path);

        Ok(Self { pool, config })
    }

    /// Get a connection from the pool
    pub fn get_conn(&self) -> AppResult<PooledConnection<SqliteConnectionManager>> {
        self.pool.get().map_err(|e| {
            AppError::Database(
                ErrorValue::new(ErrorCode::DbConnectionFailed, "Failed to get database connection")
                    .with_cause(e.to_string())
                    .with_context("operation", "get_conn")
            )
        })
    }

    /// Initialize the database schema
    pub fn init(&self) -> AppResult<()> {
        let conn = self.get_conn()?;

        // Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON", [])?;

        // Create users table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                role TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Active',
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )",
            [],
        )?;

        // Create products table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category TEXT NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0
            )",
            [],
        )?;

        // Create indexes for performance
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)",
            [],
        )?;

        info!("Database schema initialized with indexes");
        Ok(())
    }

    /// Execute a raw SELECT query and return results as JSON
    pub fn query(&self, sql: &str, params: &[&dyn ToSql]) -> AppResult<QueryResult> {
        let conn = self.get_conn()?;
        
        let mut stmt = conn.prepare(sql)?;
        let column_names: Vec<String> = stmt
            .column_names()
            .into_iter()
            .map(|s| s.to_string())
            .collect();

        let rows = stmt.query_map(params, |row| {
            let mut row_map = serde_json::Map::new();

            for (idx, col_name) in column_names.iter().enumerate() {
                let value = Self::get_column_value(row, idx)?;
                row_map.insert(col_name.clone(), value);
            }

            Ok(row_map)
        })?;

        let mut data = Vec::new();
        for row in rows {
            data.push(row?);
        }

        Ok(QueryResult::success(data, "Query executed successfully"))
    }

    /// Execute a raw INSERT, UPDATE, or DELETE query
    #[allow(dead_code)]
    pub fn execute(&self, sql: &str, params: &[&dyn ToSql]) -> AppResult<QueryResult> {
        let conn = self.get_conn()?;
        let rows_affected = conn.execute(sql, params)?;

        Ok(QueryResult::success(vec![], "Query executed successfully")
            .with_rows_affected(rows_affected))
    }

    /// Execute within a transaction
    #[allow(dead_code)]
    pub fn transaction<F, T>(&self, f: F) -> AppResult<T>
    where
        F: FnOnce(&Connection) -> AppResult<T>,
    {
        let conn = self.get_conn()?;
        
        conn.execute("BEGIN", [])?;
        
        match f(&conn) {
            Ok(result) => {
                conn.execute("COMMIT", [])?;
                Ok(result)
            }
            Err(e) => {
                conn.execute("ROLLBACK", [])?;
                error!("Transaction rolled back due to error: {}", e);
                Err(e)
            }
        }
    }

    /// Get pool statistics
    pub fn pool_stats(&self) -> PoolStats {
        let state = self.pool.state();
        PoolStats {
            connections: state.connections,
            idle_connections: state.idle_connections,
        }
    }

    /// Helper function to extract column value from row
    fn get_column_value(row: &rusqlite::Row, idx: usize) -> SqliteResult<serde_json::Value> {
        if let Ok(val) = row.get::<_, i64>(idx) {
            return Ok(serde_json::Value::Number(val.into()));
        }
        if let Ok(val) = row.get::<_, f64>(idx) {
            return Ok(serde_json::Number::from_f64(val)
                .map(serde_json::Value::Number)
                .unwrap_or(serde_json::Value::Null));
        }
        if let Ok(val) = row.get::<_, String>(idx) {
            return Ok(serde_json::Value::String(val));
        }
        if let Ok(val) = row.get::<_, Option<i64>>(idx) {
            return Ok(val
                .map(|v| serde_json::Value::Number(v.into()))
                .unwrap_or(serde_json::Value::Null));
        }

        Ok(serde_json::Value::Null)
    }
}

/// Pool statistics for monitoring
#[derive(Debug, Clone)]
pub struct PoolStats {
    pub connections: u32,
    pub idle_connections: u32,
}

impl PoolStats {
    pub fn utilization(&self) -> f64 {
        if self.connections == 0 {
            return 0.0;
        }
        (self.connections - self.idle_connections) as f64 / self.connections as f64 * 100.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_with_pool() {
        let db = Database::new(":memory:").expect("Failed to create in-memory database");
        assert!(db.init().is_ok());
        
        // Test connection pooling
        let conn1 = db.get_conn().expect("Failed to get connection");
        let conn2 = db.get_conn().expect("Failed to get second connection");
        
        // Both connections should be usable
        assert!(conn1.is_valid().is_ok());
        assert!(conn2.is_valid().is_ok());
        
        // Check pool stats
        let stats = db.pool_stats();
        assert!(stats.connections >= 2);
    }

    #[test]
    fn test_transaction_commit() {
        let db = Database::new(":memory:").expect("Failed to create database");
        db.init().expect("Failed to init");

        let result = db.transaction(|conn| {
            conn.execute(
                "INSERT INTO users (name, email, role, status) VALUES (?, ?, ?, ?)",
                ["Test User", "test@example.com", "Admin", "Active"],
            )?;
            Ok(())
        });

        assert!(result.is_ok());
    }

    #[test]
    fn test_transaction_rollback() {
        let db = Database::new(":memory:").expect("Failed to create database");
        db.init().expect("Failed to init");

        // This should rollback due to error
        let result = db.transaction(|conn| {
            conn.execute(
                "INSERT INTO users (name, email, role, status) VALUES (?, ?, ?, ?)",
                ["Test User", "test@example.com", "Admin", "Active"],
            )?;
            // Force an error
            Err(AppError::Database(
                ErrorValue::new(ErrorCode::DbQueryFailed, "Forced error")
            ))
        });

        assert!(result.is_err());
        
        // Verify no data was inserted
        let count: i64 = db.get_conn().unwrap()
            .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }
}
