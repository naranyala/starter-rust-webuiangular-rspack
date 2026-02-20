#![allow(dead_code)]
use log::{debug, info};
use webui_rs::webui;

// UI-related event handlers
pub fn setup_ui_handlers(window: &mut webui::Window) {
    // Bind HTML elements with Rust functions
    window.bind("open_folder", |_event| {
        info!("Open folder button clicked!");
        // In a real app, this would open a folder selection dialog
        // For now, we'll just return a success response
    });

    window.bind("organize_images", |_event| {
        info!("Organize images button clicked!");
        // In a real app, this would organize the images
        // For now, we'll just return a success response
    });
}

// Counter-related event handlers
pub fn setup_counter_handlers(window: &mut webui::Window) {
    window.bind("increment_counter", |event| {
        // Get the element name that triggered the event
        let element_name = unsafe {
            std::ffi::CStr::from_ptr(event.element)
                .to_string_lossy()
                .into_owned()
        };

        // Log the increment operation
        info!(
            "Counter incremented in Rust backend - Element: {}",
            element_name
        );
        debug!(
            "Increment event details - element: {}, window: {}",
            element_name, event.window
        );
    });

    window.bind("reset_counter", |event| {
        // Get the element name that triggered the event
        let element_name = unsafe {
            std::ffi::CStr::from_ptr(event.element)
                .to_string_lossy()
                .into_owned()
        };

        // Log the reset operation
        info!("Counter reset in Rust backend - Element: {}", element_name);
        debug!(
            "Reset event details - element: {}, window: {}",
            element_name, event.window
        );
    });
}
