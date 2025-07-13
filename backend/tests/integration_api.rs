use reqwest::Client;

#[tokio::test]
async fn test_health_endpoint() {
    let client = Client::new();
    let resp = client.get("http://localhost:3001/api/health").send().await.unwrap();
    assert!(resp.status().is_success());
    let json: serde_json::Value = resp.json().await.unwrap();
    assert_eq!(json["status"], "ok");
}

#[tokio::test]
async fn test_tts_voices_endpoint() {
    let client = Client::new();
    let resp = client.get("http://localhost:3001/api/tts/voices").send().await.unwrap();
    assert!(resp.status().is_success());
    let voices: Vec<String> = resp.json().await.unwrap();
    assert!(!voices.is_empty());
}

#[tokio::test]
async fn test_chats_endpoint() {
    let client = Client::new();
    let resp = client.get("http://localhost:3001/api/chats").send().await.unwrap();
    assert!(resp.status().is_success());
    let chats: serde_json::Value = resp.json().await.unwrap();
    assert!(chats.is_array());
}

#[tokio::test]
async fn test_chat_endpoint() {
    let client = Client::new();
    let payload = serde_json::json!({
        "message": "What is hypertension?"
    });
    let resp = client.post("http://localhost:3001/api/chat")
        .json(&payload)
        .send().await.unwrap();
    assert!(resp.status().is_success());
    let json: serde_json::Value = resp.json().await.unwrap();
    assert!(json["success"].as_bool().unwrap_or(false));
    assert!(json["response"].as_str().unwrap_or("").contains("hypertension"));
} 