use log::{LevelFilter, info, error, warn, debug};
use env_logger::{Builder, Target};
use std::io::Write;
use chrono::Utc;

pub fn init_logging() {
    let mut builder = Builder::from_default_env();
    
    // Set default log level if not specified
    if std::env::var("RUST_LOG").is_err() {
        builder.filter_level(LevelFilter::Info);
    }
    
    // Configure the logger
    builder
        .format(|buf, record| {
            writeln!(
                buf,
                "{} [{}] {} - {}",
                chrono::Utc::now().format("%Y-%m-%d %H:%M:%S%.3f"),
                record.level(),
                record.target(),
                record.args()
            )
        })
        .target(Target::Stdout)
        .init();
    
    info!("Logging initialized");
}

pub fn log_operation_start(operation: &str, details: &str) {
    info!("Starting operation: {} - {}", operation, details);
}

pub fn log_operation_success(operation: &str, duration: std::time::Duration) {
    info!("Operation completed successfully: {} (took {:?})", operation, duration);
}

pub fn log_operation_failure(operation: &str, error: &str) {
    error!("Operation failed: {} - Error: {}", operation, error);
}

pub fn log_retry_attempt(operation: &str, attempt: usize, max_attempts: usize) {
    warn!("Retry attempt {}/{} for operation: {}", attempt, max_attempts, operation);
}

pub fn log_circuit_breaker_state_change(old_state: &str, new_state: &str) {
    info!("Circuit breaker state changed: {} -> {}", old_state, new_state);
}

pub fn log_model_request(model: &str, prompt_length: usize) {
    debug!("Making request to model: {} (prompt length: {})", model, prompt_length);
} 