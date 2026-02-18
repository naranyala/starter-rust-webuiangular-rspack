#![allow(dead_code)]
// src/core/infrastructure/database/users.rs
// User-specific database operations

use chrono::Local;
use rusqlite::{params, Result as SqliteResult};

use super::connection::Database;
use super::models::User;

impl Database {
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
    pub fn insert_user(
        &self,
        name: &str,
        email: &str,
        role: &str,
        status: &str,
    ) -> SqliteResult<i64> {
        let conn = self.conn.lock().unwrap();
        let created_at = Local::now().to_rfc3339();

        conn.execute(
            "INSERT INTO users (name, email, role, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            [name, email, role, status, &created_at],
        )?;

        Ok(conn.last_insert_rowid())
    }

    /// Delete a user by ID
    pub fn delete_user(&self, id: i64) -> SqliteResult<usize> {
        let conn = self.conn.lock().unwrap();
        let rows_deleted = conn.execute("DELETE FROM users WHERE id = ?1", [id])?;
        Ok(rows_deleted)
    }

    /// Update a user by ID
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
            )?;
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
            )?;
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
            .unwrap();
        assert_eq!(id, 1);

        let users = db.get_all_users().unwrap();
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
        let deleted = db.delete_user(id).unwrap();
        assert_eq!(deleted, 1);
    }
}
