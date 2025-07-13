pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

pub type Error = Box<dyn std::error::Error + Send + Sync>; // For early dev.

pub mod consts {
    pub const MODEL: &str = "llama3.2:1b";
    pub const DEFAULT_SYSTEM_MOCK: &str = r#"
    Always be very concise in your answer.

    You are a helpful assistant that can answer questions about health and provide recommendations.
    "#;
}

pub mod api;
pub mod db;
pub mod state;
pub mod types;
pub mod client;
pub mod logging;
pub mod retry;
pub mod circuit_breaker;