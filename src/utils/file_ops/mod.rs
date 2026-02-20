#![allow(dead_code)]
use std::path::PathBuf;

pub struct FileUtils;

impl FileUtils {
    pub fn read_file(path: &PathBuf) -> Result<String, String> {
        std::fs::read_to_string(path).map_err(|e| e.to_string())
    }

    pub fn write_file(path: &PathBuf, content: &str) -> Result<(), String> {
        std::fs::write(path, content).map_err(|e| e.to_string())
    }

    pub fn file_exists(path: &PathBuf) -> bool {
        path.exists()
    }

    pub fn create_dir(path: &PathBuf) -> Result<(), String> {
        std::fs::create_dir_all(path).map_err(|e| e.to_string())
    }

    pub fn copy_file(from: &PathBuf, to: &PathBuf) -> Result<(), String> {
        std::fs::copy(from, to)
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    pub fn delete_file(path: &PathBuf) -> Result<(), String> {
        std::fs::remove_file(path).map_err(|e| e.to_string())
    }
}
