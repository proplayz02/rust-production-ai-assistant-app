use axum::{extract::State, Json, http::StatusCode};
use serde::{Deserialize, Serialize};
use crate::state::AppState;
use crate::types::{ChatRequest, ChatResponse};
use crate::db::chat_message::ChatMessageDoc;
use crate::retry::retry_async_with_backoff;
use mongodb::bson::doc;
use futures_util::stream::StreamExt;
use std::time::Duration;

pub async fn chat_handler(
    State(state): State<AppState>,
    Json(payload): Json<ChatRequest>,
) -> Result<Json<ChatResponse>, StatusCode> {
    use mongodb::bson::DateTime as MongoDateTime;

    log::info!("Received chat request: {}", payload.message);

    let system_prompt = payload.system_prompt.unwrap_or_else(|| {
        r#"You are a helpful AI doctor assistant. Always provide accurate, helpful medical information while being clear that you are an AI and not a replacement for professional medical advice. Be concise but thorough in your responses."#.to_string()
    });

    // Save user message
    let user_doc = ChatMessageDoc {
        id: None,
        role: "user".to_string(),
        content: payload.message.clone(),
        timestamp: std::time::SystemTime::now().into(),
    };
    let _ = state.chat_collection.insert_one(user_doc, None).await;

    let ai_result = state.client.generate(payload.message, Some(system_prompt)).await;

    match ai_result {
        Ok(response) => {
            // Save assistant message
            let ai_doc = ChatMessageDoc {
                id: None,
                role: "assistant".to_string(),
                content: response.clone(),
                timestamp: std::time::SystemTime::now().into(),
            };
            let _ = state.chat_collection.insert_one(ai_doc, None).await;

            log::info!("Successfully generated response");
            Ok(Json(ChatResponse {
                response,
                success: true,
                error: None,
            }))
        }
        Err(e) => {
            log::error!("Failed to generate response: {}", e);
            Ok(Json(ChatResponse {
                response: String::new(),
                success: false,
                error: Some(e.to_string()),
            }))
        }
    }
}

pub async fn get_chats_handler(
    State(state): State<AppState>,
) -> Result<Json<Vec<ChatMessageDoc>>, StatusCode> {
    let find_op = || async {
        state.chat_collection
            .find(None, Some(mongodb::options::FindOptions::builder().sort(doc! {"timestamp": 1}).build()))
            .await
    };
    let mut cursor = match retry_async_with_backoff(find_op, 3, Duration::from_millis(200), 2.0).await {
        Ok(cursor) => cursor,
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };
    let mut chats = Vec::new();
    while let Some(result) = cursor.next().await {
        match result {
            Ok(chat) => chats.push(chat),
            Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
        }
    }
    Ok(Json(chats))
}

// The #[cfg(test)] mod tests { ... } block will be moved to tests/unit/api_chat.rs 