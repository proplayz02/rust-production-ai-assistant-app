// Unit tests for api/chat.rs
use resilient_ai_agent::types::{ChatRequest, ChatResponse};

#[test]
fn test_chat_request_serialization() {
    let req = ChatRequest {
        message: "Hello".to_string(),
        system_prompt: Some("Prompt".to_string()),
    };
    let json = serde_json::to_string(&req).unwrap();
    assert!(json.contains("Hello"));
    assert!(json.contains("Prompt"));
}

#[test]
fn test_chat_response_serialization() {
    let resp = ChatResponse {
        response: "Hi!".to_string(),
        success: true,
        error: None,
    };
    let json = serde_json::to_string(&resp).unwrap();
    assert!(json.contains("Hi!"));
    assert!(json.contains("success"));
} 