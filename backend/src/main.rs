use axum::{
    routing::{post, get},
    http::{Method},
    Router,
};
use tower_http::cors::{CorsLayer, Any};
use std::sync::Arc;
use resilient_ai_agent::client::ResilientOllamaClient;
use resilient_ai_agent::logging::init_logging;
use resilient_ai_agent::db::chat_message::ChatMessageDoc;
use resilient_ai_agent::api::chat::{chat_handler, get_chats_handler};
use resilient_ai_agent::api::health::health_handler;
use resilient_ai_agent::api::{tts_handler, tts_voices_handler};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Initialize logging
    init_logging();
    log::info!("Starting AI Doctor Assistant API server...");

    // MongoDB setup
    let mongo_uri = std::env::var("MONGODB_URI").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let mongo_client = mongodb::Client::with_uri_str(&mongo_uri).await?;
    let db = mongo_client.database("ai_doctor");
    let chat_collection = db.collection::<ChatMessageDoc>("chats");

    let client = Arc::new(ResilientOllamaClient::new());
    let state = resilient_ai_agent::state::AppState { client, chat_collection };

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin([
            "http://localhost:3000".parse().unwrap(),
            "http://192.168.1.98:3000".parse().unwrap(),
            "http://192.168.1.90:3000".parse().unwrap(),
        ])
        .allow_headers(Any);

    // Build our application with a route
    let app = Router::new()
        .route("/api/chat", post(chat_handler))
        .route("/api/health", get(health_handler))
        .route("/api/chats", get(get_chats_handler))
        .route("/api/tts", post(tts_handler))
        .route("/api/tts/voices", get(tts_voices_handler))
        .layer(cors)
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await?;
    log::info!("Server listening on http://0.0.0.0:3001");

    axum::serve(listener, app).await?;
    Ok(())
} 