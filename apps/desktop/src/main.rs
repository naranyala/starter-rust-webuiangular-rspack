// apps/desktop/src/main.rs
//! Rust WebUI Desktop Application
//! 
//! Demonstrates core + plugin-driven architecture with MVVM pattern

use rustwebui_core::prelude::*;
use rustwebui_core::plugin::*;
use log::{info, error};
use std::sync::Arc;

fn main() -> Result<(), anyhow::Error> {
    // Initialize logging
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .format_timestamp(None)
        .init();
    
    info!("═══════════════════════════════════════════");
    info!("Rust WebUI Application v1.0.0");
    info!("Core + Plugin-Driven Architecture");
    info!("═══════════════════════════════════════════");
    
    // Initialize core
    rustwebui_core::init()?;
    
    // Initialize DI container
    init_container();
    let container = get_container();
    
    // Create plugin manager
    let mut plugin_manager = PluginManager::new();
    
    // Register plugins
    info!("Loading plugins...");
    
    // Register database plugin
    let db_plugin = Box::new(plugin_database::DatabasePlugin::new());
    plugin_manager.register(db_plugin)?;
    info!("  ✓ Database plugin registered");
    
    // List available plugins
    info!("Available plugins:");
    for plugin_info in plugin_manager.list_plugins() {
        info!("  - {} v{} ({})", 
            plugin_info.name, 
            plugin_info.version,
            match plugin_info.state {
                PluginState::Active => "active",
                PluginState::Loaded => "loaded",
                PluginState::Loading => "loading",
                PluginState::Unloaded => "unloaded",
                PluginState::Error => "error",
            }
        );
    }
    
    // Initialize plugins
    info!("Initializing plugins...");
    for plugin_info in plugin_manager.list_plugins() {
        if let Err(e) = plugin_manager.load(&plugin_info.id) {
            error!("Failed to load plugin {}: {}", plugin_info.id, e);
        } else {
            info!("  ✓ {} plugin initialized", plugin_info.name);
        }
    }
    
    // Register core services
    container.register(Arc::new(plugin_manager));
    
    info!("═══════════════════════════════════════════");
    info!("Application initialized successfully!");
    info!("═══════════════════════════════════════════");
    
    // TODO: Initialize WebUI and start application
    // This is where you would:
    // 1. Create WebUI window
    // 2. Register event handlers from plugins
    // 3. Start the event loop
    
    info!("Application ready. Waiting for events...");
    
    // For now, just keep running
    std::thread::sleep(std::time::Duration::from_secs(1));
    
    info!("Application shutting down...");
    
    Ok(())
}
