use std::env;
use std::fs;
use std::path::Path;
use std::time::Instant;

fn main() {
    let start_time = Instant::now();
    let project_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    
    println!("cargo:warning========================================");
    println!("cargo:warning=Starting Rust build pipeline");
    println!("cargo:warning=Project: {}", project_dir);
    println!("cargo:warning========================================");

    let config_gen_start = Instant::now();
    generate_build_config(&project_dir);
    println!("cargo:warning=[build.rs] Config generation: {:?}", config_gen_start.elapsed());

    let src_dir = format!("{}/thirdparty/webui-c-src/src", project_dir);
    let civetweb_dir = format!("{}/civetweb", src_dir);

    println!("cargo:warning=[build.rs] Compiling C library (webui + civetweb)...");
    let compile_start = Instant::now();

    let mut build = cc::Build::new();
    build
        .include(format!("{}/thirdparty/webui-c-src/include", project_dir))
        .include(&src_dir)
        .include(&civetweb_dir)
        .warnings(true)
        .flag("-fPIC")
        .define("WEBUI_LOG", None)
        .define("USE_CIVETWEB", None)
        .define("NO_SSL", None)
        .define("NO_CACHING", None)
        .define("USE_WEBSOCKET", None)
        .define("USE_IPV6", None);

    build.file(format!("{}/webui.c", src_dir));
    build.file(format!("{}/civetweb/civetweb.c", src_dir));

    println!("cargo:warning=[build.rs]   Sources: webui.c, civetweb.c");
    println!("cargo:warning=[build.rs]   Flags: -fPIC, WEBUI_LOG, USE_CIVETWEB, NO_SSL, NO_CACHING, USE_WEBSOCKET, USE_IPV6");

    build.compile("webui-2-static");
    
    println!("cargo:warning=[build.rs] C compilation: {:?}", compile_start.elapsed());

    println!("cargo:rustc-link-search=native=./");
    println!("cargo:rustc-link-lib=webui-2-static");

    let webui_root = format!("{}/thirdparty/webui-c-src", project_dir);
    let mut c_files = 0;
    for entry in walkdir::WalkDir::new(&webui_root) {
        if let Ok(entry) = entry {
            if entry
                .path()
                .extension()
                .is_some_and(|ext| ext == "c" || ext == "h")
            {
                println!("cargo:rerun-if-changed={}", entry.path().display());
                c_files += 1;
            }
        }
    }
    println!("cargo:warning=[build.rs] Watching {} C/H files for changes", c_files);

    let config_paths = [
        format!("{}/app.config.toml", project_dir),
        format!("{}/config/app.config.toml", project_dir),
    ];
    for config_path in &config_paths {
        if Path::new(config_path).exists() {
            println!("cargo:rerun-if-changed={}", config_path);
            println!("cargo:warning=[build.rs] Config file: {}", config_path);
        }
    }

    let post_build_path = format!("{}/post-build.sh", project_dir);
    if Path::new(&post_build_path).exists() {
        println!("cargo:warning=Run './post-build.sh' after build to rename executable");
    }

    println!("cargo:warning========================================");
    println!("cargo:warning=Build pipeline setup completed");
    println!("cargo:warning=Total build.rs time: {:?}", start_time.elapsed());
    println!("cargo:warning========================================");
}

fn generate_build_config(project_dir: &str) {
    let config_paths = [
        format!("{}/app.config.toml", project_dir),
        format!("{}/config/app.config.toml", project_dir),
    ];

    let mut executable_name = String::from("rustwebui-app");
    let mut package_name = String::from("rustwebui-app");
    let mut log_level = String::from("info");
    let mut log_file = String::from("application.log");

    for config_path in &config_paths {
        if let Ok(content) = fs::read_to_string(config_path) {
            println!("cargo:warning=[build.rs] Found config at: {}", config_path);
            
            if let Ok(config) = content.parse::<toml::Value>() {
                if let Some(exe_name) = config
                    .get("executable")
                    .and_then(|e| e.get("name"))
                    .and_then(|n| n.as_str())
                    && !exe_name.is_empty() 
                {
                    executable_name = exe_name.to_string();
                }
                
                if let Some(log) = config.get("logging") {
                    if let Some(level) = log.get("level").and_then(|l| l.as_str()) {
                        log_level = level.to_string();
                    }
                    if let Some(file) = log.get("file").and_then(|f| f.as_str()) {
                        log_file = file.to_string();
                    }
                }
            }
            break;
        }
    }

    if let Ok(name) = env::var("CARGO_PKG_NAME") {
        package_name = name;
    }

    let out_dir = env::var("OUT_DIR").unwrap();
    let build_config_path = format!("{}/build_config.rs", out_dir);

    let build_config = format!(
        r#"// Auto-generated build configuration
// This file is generated by build.rs

pub const PACKAGE_NAME: &str = "{}";
pub const PACKAGE_VERSION: &str = "{}";
pub const EXECUTABLE_NAME: &str = "{}";
pub const DEFAULT_LOG_LEVEL: &str = "{}";
pub const DEFAULT_LOG_FILE: &str = "{}";

pub fn get_executable_name() -> &'static str {{
    EXECUTABLE_NAME
}}

pub fn get_log_level() -> &'static str {{
    DEFAULT_LOG_LEVEL
}}

pub fn get_log_file() -> &'static str {{
    DEFAULT_LOG_FILE
}}
"#,
        package_name,
        env::var("CARGO_PKG_VERSION").unwrap_or_else(|_| "1.0.0".to_string()),
        executable_name,
        log_level,
        log_file
    );

    if let Err(e) = fs::write(&build_config_path, build_config) {
        eprintln!("Warning: Failed to write build config: {}", e);
    } else {
        println!("cargo:warning=[build.rs] Generated build config: {}", build_config_path);
    }
}
