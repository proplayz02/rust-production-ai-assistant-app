use std::sync::Arc;
use crate::db::chat_message::ChatMessageDoc;
use crate::client::ResilientOllamaClient;
use mongodb::Collection;

#[derive(Clone)]
pub struct AppState {
    pub client: std::sync::Arc<ResilientOllamaClient>,
    pub chat_collection: mongodb::Collection<ChatMessageDoc>,
} 