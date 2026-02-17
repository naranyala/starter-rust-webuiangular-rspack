// core/backend/src/infrastructure/di/mod.rs
//! Dependency Injection

use std::any::Any;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Dependency Injection Container
#[derive(Default)]
pub struct DIContainer {
    services: Arc<Mutex<HashMap<String, Arc<dyn Any + Send + Sync>>>>,
}

impl DIContainer {
    pub fn new() -> Self {
        Self::default()
    }
    
    pub fn register<T: Any + Send + Sync>(&self, service: Arc<T>) {
        let type_name = std::any::type_name::<T>().to_string();
        let mut services = self.services.lock().unwrap();
        services.insert(type_name, service);
    }
    
    pub fn get<T: Any + Send + Sync>(&self) -> Option<Arc<T>> {
        let services = self.services.lock().unwrap();
        let type_name = std::any::type_name::<T>().to_string();
        services
            .get(&type_name)
            .and_then(|s| s.clone().downcast::<T>().ok())
    }
}

/// Global DI container
lazy_static::lazy_static! {
    static ref GLOBAL_CONTAINER: DIContainer = DIContainer::new();
}

pub fn init_container() {
    log::info!("DI Container initialized");
}

pub fn get_container() -> &'static DIContainer {
    &GLOBAL_CONTAINER
}
