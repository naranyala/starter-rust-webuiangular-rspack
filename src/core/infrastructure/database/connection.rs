#![allow(dead_code)]
// src/core/infrastructure/database/connection.rs
// Database connection management

use log::info;
use rusqlite::{Connection, Result as SqliteResult};
use std::sync::{Arc, Mutex};

use super::models::QueryResult;
use crate::core::error::{AppError, AppResult, ErrorValue, ErrorCode};

/// Database manager with raw query support
pub struct Database {
    pub(super) conn: Arc<Mutex<Connection>>,
}

impl Database {
    /// Create a new database connection
    pub fn new(db_path: &str) -> SqliteResult<Self> {
        let conn = Connection::open(db_path)?;
        info!("Database connection established: {}", db_path);

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    /// Get database connection
    pub fn get_connection(&self) -> AppResult<std::sync::MutexGuard<'_, Connection>> {
        self.conn
            .lock()
            .map_err(|e| {
                AppError::LockPoisoned(
                    ErrorValue::new(ErrorCode::LockPoisoned, "Failed to acquire database connection lock")
                        .with_cause(e.to_string())
                        .with_context("operation", "get_connection")
                )
            })
    }

    /// Initialize the database with tables
    pub fn init(&self) -> AppResult<()> {
        let conn = self.get_connection()?;

        // Create users table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                role TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Active',
                created_at TEXT NOT NULL
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

        info!("Database schema initialized");
        Ok(())
    }

    /// Execute a raw SELECT query and return results as JSON
    pub fn query(&self, sql: &str, params: &[&dyn rusqlite::ToSql]) -> AppResult<QueryResult> {
        let conn = self.get_connection()?;

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
    pub fn execute(&self, sql: &str, params: &[&dyn rusqlite::ToSql]) -> AppResult<QueryResult> {
        let conn = self.get_connection()?;
        let rows_affected = conn.execute(sql, params)?;

        Ok(QueryResult::success(vec![], "Query executed successfully")
            .with_rows_affected(rows_affected))
    }

    /// Helper function to extract column value from row
    pub fn get_column_value(row: &rusqlite::Row, idx: usize) -> SqliteResult<serde_json::Value> {
        // Try different types
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_init() {
        let db = Database::new(":memory:").expect("Failed to create in-memory database");
        assert!(db.init().is_ok());
    }
}
