// Unit tests for types.rs
use resilient_ai_agent::types::{HealthResponse, ChatRequest, ChatResponse};

#[test]
fn test_health_response_serialization() {
    let resp = HealthResponse {
        status: "ok".to_string(),
        model_available: true,
    };
    let json = serde_json::to_string(&resp).unwrap();
    assert!(json.contains("ok"));
    assert!(json.contains("model_available"));
}

#[test]
fn test_chat_request_roundtrip() {
    let req = ChatRequest {
        message: "hi".to_string(),
        system_prompt: None,
    };
    let json = serde_json::to_string(&req).unwrap();
    let de: ChatRequest = serde_json::from_str(&json).unwrap();
    assert_eq!(de.message, "hi");
    assert_eq!(de.system_prompt, None);
}

#[test]
fn test_chat_response_roundtrip() {
    let resp = ChatResponse {
        response: "hello".to_string(),
        success: true,
        error: None,
    };
    let json = serde_json::to_string(&resp).unwrap();
    let de: ChatResponse = serde_json::from_str(&json).unwrap();
    assert_eq!(de.response, "hello");
    assert!(de.success);
    assert_eq!(de.error, None);
} 