use axum::{extract::State, Json, http::StatusCode};
use serde::{Deserialize, Serialize};
use crate::state::AppState;
use crate::types::{ChatRequest, ChatResponse};
use crate::db::chat_message::ChatMessageDoc;
use crate::retry::retry_async_with_backoff;
use mongodb::bson::doc;
use futures_util::stream::StreamExt;
use std::time::Duration;
use regex::Regex;

fn filter_ai_response(user_message: &str, ai_response: &str) -> String {
    // 1. Prompt injection mitigation: look for common jailbreak phrases
    let injection_patterns = [
        r"(?i)ignore previous instructions",
        r"(?i)as an ai language model",
        r"(?i)disregard all prior",
        r"(?i)pretend to be",
        r"(?i)you are now",
        r"(?i)jailbreak",
        r"(?i)do anything now",
        r"(?i)unfiltered response",
        r"(?i)developer mode",
    ];
    for pat in &injection_patterns {
        let re = Regex::new(pat).unwrap();
        if re.is_match(ai_response) {
            return "I'm sorry, but I cannot comply with that request.".to_string();
        }
    }

    // 2. Guardrail: If the response does not mention medical/health topics, refuse
    let medical_keywords = [
        "medical", "health", "doctor", "medicine", "symptom", "treatment", "diagnosis", "patient", "disease", "condition", "therapy", "prescription", "illness", "clinical", "pharmacy", "nurse", "hospital", "wellness", "injury", "recovery", "prevention"
    ];
    let mut found_medical = false;
    for word in &medical_keywords {
        if ai_response.to_lowercase().contains(word) {
            found_medical = true;
            break;
        }
    }
    if !found_medical {
        return "I'm only able to answer questions about medical or health topics. Please ask a health-related question.".to_string();
    }

    // 3. Otherwise, return the original response
    ai_response.to_string()
}

pub async fn chat_handler(
    State(state): State<AppState>,
    Json(payload): Json<ChatRequest>,
) -> Result<Json<ChatResponse>, StatusCode> {
    use mongodb::bson::DateTime as MongoDateTime;

    log::info!("Received chat request: {}", payload.message);

    let system_prompt = payload.system_prompt.unwrap_or_else(|| {
        r#"You are a helpful AI doctor assistant. You must only answer questions that are strictly about medical or health topics. If a user asks about anything outside of medicine or health, politely refuse and explain that you can only assist with medical and health-related questions. Always provide accurate, helpful medical information while being clear that you are an AI and not a replacement for professional medical advice. Be concise but thorough in your responses."#.to_string()
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
            let filtered_response = filter_ai_response(&payload.message, &response);
            let ai_doc = ChatMessageDoc {
                id: None,
                role: "assistant".to_string(),
                content: filtered_response.clone(),
                timestamp: std::time::SystemTime::now().into(),
            };
            let _ = state.chat_collection.insert_one(ai_doc, None).await;

            log::info!("Successfully generated response");
            Ok(Json(ChatResponse {
                response: filtered_response,
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