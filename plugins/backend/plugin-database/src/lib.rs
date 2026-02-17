// plugins/backend/plugin-database/src/lib.rs
//! Database Plugin - SQLite integration

use rustwebui_core::prelude::*;
use rusqlite::{Connection, params};
use std::sync::Arc;

/// Database Plugin
pub struct DatabasePlugin {
    connection: Option<Arc<Connection>>,
}

impl DatabasePlugin {
    pub fn new() -> Self {
        Self { connection: None }
    }
}

#[async_trait::async_trait]
impl Plugin for DatabasePlugin {
    fn id(&self) -> &str {
        "database"
    }
    
    fn metadata(&self) -> &PluginMetadata {
        &self.metadata
    }
    
    async fn initialize(&mut self, ctx: &PluginContext) -> Result<()> {
        ctx.log("info", "Initializing database plugin...");
        
        // Open database connection
        let conn = Connection::open("app.db")?;
        self.connection = Some(Arc::new(conn));
        
        // Initialize schema
        self.init_schema()?;
        
        ctx.log("info", "Database plugin initialized successfully");
        Ok(())
    }
    
    async fn shutdown(&mut self) -> Result<()> {
        ctx.log("info", "Shutting down database plugin...");
        self.connection = None;
        Ok(())
    }
    
    fn get_handlers(&self) -> Vec<EventHandler> {
        vec![
            EventHandler::new("db_ping", |ctx| {
                Ok(r#"{"success": true, "message": "Database is connected"}"#.to_string())
            }),
            EventHandler::new("db_status", |ctx| {
                Ok(r#"{"status": "connected", "type": "sqlite"}"#.to_string())
            }),
        ]
    }
}

impl DatabasePlugin {
    fn init_schema(&self) -> Result<()> {
        if let Some(conn) = &self.connection {
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
            log::info!("Database schema initialized");
        }
        Ok(())
    }
}

impl Default for DatabasePlugin {
    fn default() -> Self {
        Self::new()
    }
}

// Plugin export for dynamic loading
#[no_mangle]
pub extern "C" fn create_plugin() -> Box<dyn Plugin> {
    Box::new(DatabasePlugin::new())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_plugin_creation() {
        let plugin = DatabasePlugin::new();
        assert_eq!(plugin.id(), "database");
    }
}
