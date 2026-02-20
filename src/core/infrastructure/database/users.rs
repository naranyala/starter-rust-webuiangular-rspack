#![allow(dead_code)]
// src/core/infrastructure/database/users.rs
// User-specific database operations with "errors as values" pattern

use chrono::Local;
use rusqlite::params;

use super::connection::Database;
use super::models::User;
use crate::core::error::{ErrorCode, ErrorValue};
use crate::core::error::AppError;

/// Database operation result type alias
type DbResult<T> = Result<T, AppError>;

impl Database {
    /// Get all users
    /// Returns a vector of users or a structured database error
    pub fn get_all_users(&self) -> DbResult<Vec<User>> {
        let conn = self.conn.lock().map_err(|_| {
            AppError::LockPoisoned(
                ErrorValue::new(ErrorCode::LockPoisoned, "Failed to acquire database connection lock")
                    .with_cause("Mutex poisoned")
                    .with_context("operation", "get_all_users")
            )
        })?;

        let mut stmt = conn
            .prepare("SELECT id, name, email, role, status, created_at FROM users ORDER BY id")
            .map_err(|e| {
                AppError::Database(
                    ErrorValue::new(ErrorCode::DbQueryFailed, "Failed to prepare users query")
                        .with_cause(e.to_string())
                        .with_context("table", "users")
                )
            })?;

        let users = stmt.query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                role: row.get(3)?,
                status: row.get(4)?,
                created_at: row.get(5)?,
            })
        }).map_err(|e| {
            AppError::Database(
                ErrorValue::new(ErrorCode::DbQueryFailed, "Failed to query users")
                    .with_cause(e.to_string())
            )
        })?;

        users.collect::<rusqlite::Result<Vec<_>>>().map_err(|e| {
            AppError::Database(
                ErrorValue::new(ErrorCode::DbQueryFailed, "Failed to collect users")
                    .with_cause(e.to_string())
            )
        })
    }

    /// Insert a new user
    /// Returns the new user ID or a structured database error
    pub fn insert_user(
        &self,
        name: &str,
        email: &str,
        role: &str,
        status: &str,
    ) -> DbResult<i64> {
        // Validate required fields
        if name.is_empty() {
            return Err(AppError::Validation(
                ErrorValue::new(ErrorCode::MissingRequiredField, "Name is required")
                    .with_field("name")
            ));
        }
        
        if email.is_empty() {
            return Err(AppError::Validation(
                ErrorValue::new(ErrorCode::MissingRequiredField, "Email is required")
                    .with_field("email")
            ));
        }

        // Basic email validation
        if !email.contains('@') {
            return Err(AppError::Validation(
                ErrorValue::new(ErrorCode::InvalidFieldValue, "Email must be a valid email address")
                    .with_field("email")
                    .with_context("value", email)
            ));
        }

        let conn = self.conn.lock().map_err(|_| {
            AppError::LockPoisoned(
                ErrorValue::new(ErrorCode::LockPoisoned, "Failed to acquire database connection lock")
                    .with_cause("Mutex poisoned")
                    .with_context("operation", "insert_user")
            )
        })?;
        
        let created_at = Local::now().to_rfc3339();

        conn.execute(
            "INSERT INTO users (name, email, role, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            [name, email, role, status, &created_at],
        ).map_err(|e| {
            // Check for constraint violation (duplicate email)
            if e.to_string().contains("UNIQUE constraint failed") {
                AppError::Database(
                    ErrorValue::new(ErrorCode::DbAlreadyExists, "A user with this email already exists")
                        .with_field("email")
                        .with_context("value", email)
                        .with_cause(e.to_string())
                )
            } else {
                AppError::Database(
                    ErrorValue::new(ErrorCode::DbQueryFailed, "Failed to insert user")
                        .with_cause(e.to_string())
                        .with_context("operation", "insert_user")
                )
            }
        })?;

        Ok(conn.last_insert_rowid())
    }

    /// Delete a user by ID
    /// Returns the number of rows deleted or a structured database error
    pub fn delete_user(&self, id: i64) -> DbResult<usize> {
        if id <= 0 {
            return Err(AppError::Validation(
                ErrorValue::new(ErrorCode::InvalidFieldValue, "User ID must be positive")
                    .with_field("id")
                    .with_context("value", id.to_string())
            ));
        }

        let conn = self.conn.lock().map_err(|_| {
            AppError::LockPoisoned(
                ErrorValue::new(ErrorCode::LockPoisoned, "Failed to acquire database connection lock")
                    .with_cause("Mutex poisoned")
                    .with_context("operation", "delete_user")
            )
        })?;
        
        let rows_deleted = conn.execute("DELETE FROM users WHERE id = ?1", [id]).map_err(|e| {
            AppError::Database(
                ErrorValue::new(ErrorCode::DbQueryFailed, "Failed to delete user")
                    .with_cause(e.to_string())
                    .with_context("user_id", id.to_string())
            )
        })?;
        
        Ok(rows_deleted)
    }

    /// Update a user by ID
    /// Returns the number of rows updated or a structured database error
    pub fn update_user(
        &self,
        id: i64,
        name: Option<String>,
        email: Option<String>,
        role: Option<String>,
        status: Option<String>,
    ) -> DbResult<usize> {
        if id <= 0 {
            return Err(AppError::Validation(
                ErrorValue::new(ErrorCode::InvalidFieldValue, "User ID must be positive")
                    .with_field("id")
                    .with_context("value", id.to_string())
            ));
        }

        // Validate email if provided
        if let Some(ref email) = email {
            if !email.contains('@') {
                return Err(AppError::Validation(
                    ErrorValue::new(ErrorCode::InvalidFieldValue, "Email must be a valid email address")
                        .with_field("email")
                        .with_context("value", email.clone())
                ));
            }
        }

        let conn = self.conn.lock().map_err(|_| {
            AppError::LockPoisoned(
                ErrorValue::new(ErrorCode::LockPoisoned, "Failed to acquire database connection lock")
                    .with_cause("Mutex poisoned")
                    .with_context("operation", "update_user")
            )
        })?;

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
        let rows_updated = conn.execute(&query, &param_refs[..]).map_err(|e| {
            AppError::Database(
                ErrorValue::new(ErrorCode::DbQueryFailed, "Failed to update user")
                    .with_cause(e.to_string())
                    .with_context("user_id", id.to_string())
            )
        })?;

        Ok(rows_updated)
    }

    /// Insert sample data into the database
    /// Returns Ok(()) on success or a structured database error
    pub fn insert_sample_data(&self) -> DbResult<()> {
        let conn = self.conn.lock().map_err(|_| {
            AppError::LockPoisoned(
                ErrorValue::new(ErrorCode::LockPoisoned, "Failed to acquire database connection lock")
                    .with_cause("Mutex poisoned")
                    .with_context("operation", "insert_sample_data")
            )
        })?;

        // Check if users already exist
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0)).map_err(|e| {
            AppError::Database(
                ErrorValue::new(ErrorCode::DbQueryFailed, "Failed to count existing users")
                    .with_cause(e.to_string())
            )
        })?;

        if count > 0 {
            log::info!("Sample data already exists, skipping insertion");
            return Ok(());
        }

        let created_at = Local::now().to_rfc3339();

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
            ).map_err(|e| {
                AppError::Database(
                    ErrorValue::new(ErrorCode::DbQueryFailed, "Failed to insert sample user")
                        .with_cause(e.to_string())
                        .with_context("user", *name)
                )
            })?;
        }

        // Insert sample products
        let products: [(&str, &str, f64, &str, i64); 5] = [
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

        for (name, description, price, category, stock) in products.iter() {
            conn.execute(
                "INSERT INTO products (name, description, price, category, stock) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![name, description, price, category, stock],
            ).map_err(|e| {
                AppError::Database(
                    ErrorValue::new(ErrorCode::DbQueryFailed, "Failed to insert sample product")
                        .with_cause(e.to_string())
                        .with_context("product", *name)
                )
            })?;
        }

        log::info!("Sample data inserted successfully");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_insert_and_query() {
        let db = Database::new(":memory:").unwrap();
        db.init().unwrap();

        let id = db
            .insert_user("Test User", "test@example.com", "User", "Active")
            .expect("Insert should succeed");
        assert_eq!(id, 1);

        let users = db.get_all_users().expect("Query should succeed");
        assert_eq!(users.len(), 1);
        assert_eq!(users[0].name, "Test User");
    }

    #[test]
    fn test_delete_user() {
        let db = Database::new(":memory:").unwrap();
        db.init().unwrap();

        let id = db
            .insert_user("Test", "test@example.com", "User", "Active")
            .unwrap();
        let deleted = db.delete_user(id).expect("Delete should succeed");
        assert_eq!(deleted, 1);
    }

    #[test]
    fn test_insert_user_validation_empty_name() {
        let db = Database::new(":memory:").unwrap();
        db.init().unwrap();

        let result = db.insert_user("", "test@example.com", "User", "Active");
        assert!(result.is_err());
        if let Err(AppError::Validation(e)) = result {
            assert_eq!(e.field, Some("name".to_string()));
        } else {
            panic!("Expected Validation error");
        }
    }

    #[test]
    fn test_insert_user_validation_invalid_email() {
        let db = Database::new(":memory:").unwrap();
        db.init().unwrap();

        let result = db.insert_user("Test User", "invalid-email", "User", "Active");
        assert!(result.is_err());
        if let Err(AppError::Validation(e)) = result {
            assert_eq!(e.field, Some("email".to_string()));
        } else {
            panic!("Expected Validation error");
        }
    }

    #[test]
    fn test_insert_user_duplicate_email() {
        let db = Database::new(":memory:").unwrap();
        db.init().unwrap();

        db.insert_user("Test User", "test@example.com", "User", "Active").unwrap();
        let result = db.insert_user("Another User", "test@example.com", "User", "Active");
        
        assert!(result.is_err());
        if let Err(AppError::Database(e)) = result {
            assert_eq!(e.code, ErrorCode::DbAlreadyExists);
        } else {
            panic!("Expected Database error with DbAlreadyExists code");
        }
    }
}
