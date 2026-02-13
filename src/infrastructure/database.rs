// infrastructure/database.rs
// SQLite database integration with raw query support

use log::info;
use rusqlite::{Connection, Result as SqliteResult, Row};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Represents a database row as a dynamic JSON-like object
pub type DbRow = serde_json::Map<String, serde_json::Value>;

/// Result wrapper for database operations
#[derive(Debug, Serialize)]
pub struct QueryResult {
    pub success: bool,
    pub data: Vec<DbRow>,
    pub message: String,
    pub rows_affected: usize,
}

/// User record structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub email: String,
    pub role: String,
    pub status: String,
    pub created_at: String,
}

/// Database manager with raw query support
pub struct Database {
    conn: Arc<Mutex<Connection>>,
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

    /// Initialize the database with tables and sample data
    pub fn init(&self) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();

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
    pub fn query(&self, sql: &str, params: &[&dyn rusqlite::ToSql]) -> SqliteResult<QueryResult> {
        let conn = self.conn.lock().unwrap();

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

        Ok(QueryResult {
            success: true,
            data,
            message: "Query executed successfully".to_string(),
            rows_affected: 0,
        })
    }

    /// Execute a raw INSERT, UPDATE, or DELETE query
    pub fn execute(&self, sql: &str, params: &[&dyn rusqlite::ToSql]) -> SqliteResult<QueryResult> {
        let conn = self.conn.lock().unwrap();

        let rows_affected = conn.execute(sql, params)?;

        Ok(QueryResult {
            success: true,
            data: vec![],
            message: format!(
                "Query executed successfully, {} rows affected",
                rows_affected
            ),
            rows_affected,
        })
    }

    /// Get all users
    pub fn get_all_users(&self) -> SqliteResult<Vec<User>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn
            .prepare("SELECT id, name, email, role, status, created_at FROM users ORDER BY id")?;

        let users = stmt.query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                role: row.get(3)?,
                status: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;

        users.collect()
    }

    /// Insert a new user
    #[allow(dead_code)]
    pub fn insert_user(
        &self,
        name: &str,
        email: &str,
        role: &str,
        status: &str,
    ) -> SqliteResult<i64> {
        let conn = self.conn.lock().unwrap();
        let created_at = chrono::Local::now().to_rfc3339();

        conn.execute(
            "INSERT INTO users (name, email, role, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            [name, email, role, status, &created_at],
        )?;

        Ok(conn.last_insert_rowid())
    }

    /// Delete a user by ID
    #[allow(dead_code)]
    pub fn delete_user(&self, id: i64) -> SqliteResult<usize> {
        let conn = self.conn.lock().unwrap();

        let rows_deleted = conn.execute("DELETE FROM users WHERE id = ?1", [id])?;

        Ok(rows_deleted)
    }

    /// Update a user by ID
    #[allow(dead_code)]
    pub fn update_user(
        &self,
        id: i64,
        name: Option<String>,
        email: Option<String>,
        role: Option<String>,
        status: Option<String>,
    ) -> SqliteResult<usize> {
        let conn = self.conn.lock().unwrap();

        let mut query = String::from("UPDATE users SET ");
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        let mut first = true;

        if let Some(n) = name {
            if !first {
                query.push_str(", ");
            }
            query.push_str(&format!("name = ?{}", params.len() + 1));
            params.push(Box::new(n));
            first = false;
        }

        if let Some(e) = email {
            if !first {
                query.push_str(", ");
            }
            query.push_str(&format!("email = ?{}", params.len() + 1));
            params.push(Box::new(e));
            first = false;
        }

        if let Some(r) = role {
            if !first {
                query.push_str(", ");
            }
            query.push_str(&format!("role = ?{}", params.len() + 1));
            params.push(Box::new(r));
            first = false;
        }

        if let Some(s) = status {
            if !first {
                query.push_str(", ");
            }
            query.push_str(&format!("status = ?{}", params.len() + 1));
            params.push(Box::new(s));
        }

        query.push_str(&format!(" WHERE id = ?{}", params.len() + 1));
        params.push(Box::new(id));

        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
        let rows_updated = conn.execute(&query, &param_refs[..])?;

        Ok(rows_updated)
    }

    /// Insert sample data into the database
    pub fn insert_sample_data(&self) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();

        // Check if users already exist
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))?;

        if count > 0 {
            info!("Sample data already exists, skipping insertion");
            return Ok(());
        }

        let created_at = chrono::Local::now().to_rfc3339();

        let users = [
            ("John Doe", "john@example.com", "Admin", "Active"),
            ("Jane Smith", "jane@example.com", "User", "Active"),
            ("Bob Johnson", "bob@example.com", "User", "Inactive"),
            ("Alice Brown", "alice@example.com", "Editor", "Active"),
            ("Charlie Wilson", "charlie@example.com", "User", "Pending"),
            ("Diana Prince", "diana@example.com", "Admin", "Active"),
            ("Eve Anderson", "eve@example.com", "User", "Active"),
        ];

        for (name, email, role, status) in users.iter() {
            conn.execute(
                "INSERT INTO users (name, email, role, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                [*name, *email, *role, *status, &created_at],
            )?;
        }

        // Insert sample products
        let _products: [(&str, &str, f64, &str, i64); 5] = [
            (
                "Laptop Pro",
                "High-performance laptop for professionals",
                1299.99,
                "Electronics",
                25,
            ),
            (
                "Wireless Mouse",
                "Ergonomic wireless mouse",
                49.99,
                "Accessories",
                150,
            ),
            (
                "USB-C Hub",
                "7-in-1 USB-C hub with HDMI",
                79.99,
                "Accessories",
                80,
            ),
            (
                "Monitor 27\"",
                "4K Ultra HD monitor",
                449.99,
                "Electronics",
                30,
            ),
            (
                "Mechanical Keyboard",
                "RGB mechanical keyboard",
                129.99,
                "Accessories",
                60,
            ),
        ];

        for (name, description, price, category, stock) in _products.iter() {
            conn.execute(
                "INSERT INTO products (name, description, price, category, stock) VALUES (?1, ?2, ?3, ?4, ?5)",
                rusqlite::params![name, description, price, category, stock],
            )?;
        }

        info!("Sample data inserted successfully");
        Ok(())
    }

    /// Helper function to extract column value from row
    fn get_column_value(row: &Row, idx: usize) -> SqliteResult<serde_json::Value> {
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
        let db = Database::new(":memory:").unwrap();
        assert!(db.init().is_ok());
    }

    #[test]
    fn test_insert_and_query() {
        let db = Database::new(":memory:").unwrap();
        db.init().unwrap();

        let id = db
            .insert_user("Test User", "test@example.com", "User", "Active")
            .unwrap();
        assert_eq!(id, 1);

        let users = db.get_all_users().unwrap();
        assert_eq!(users.len(), 1);
        assert_eq!(users[0].name, "Test User");
    }
}
