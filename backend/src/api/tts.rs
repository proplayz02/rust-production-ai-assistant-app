use axum::{extract::Json, response::{IntoResponse, Response}, http::{StatusCode, header}, body::Body};
use serde::{Deserialize, Serialize};
use reqwest::Client;
use futures_util::StreamExt;

#[derive(Deserialize, Serialize)]
pub struct TtsRequest {
    pub text: String,
    pub voice: Option<String>,
}

pub async fn tts_handler(Json(payload): Json<TtsRequest>) -> Response {
    // TTS server URL
    let tts_url = "http://localhost:5002/api/tts";
    let client = Client::new();
    let res = client
        .post(tts_url)
        .json(&payload)
        .send()
        .await;

    match res {
        Ok(response) if response.status().is_success() => {
            let stream = response.bytes_stream();
            Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, "audio/wav")
                .header(header::CONTENT_DISPOSITION, "inline; filename=tts.wav")
                .body(Body::from_stream(stream))
                .unwrap()
        }
        Ok(response) => {
            log::warn!("TTS server error: {}", response.status());
            // Return a simple error response that the frontend can handle
            Response::builder()
                .status(StatusCode::SERVICE_UNAVAILABLE)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"error": "TTS server unavailable"}"#))
                .unwrap()
        }
        Err(e) => {
            log::warn!("TTS server connection error: {}", e);
            // Return a simple error response that the frontend can handle
            Response::builder()
                .status(StatusCode::SERVICE_UNAVAILABLE)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"error": "TTS server unavailable"}"#))
                .unwrap()
        }
    }
}

pub async fn tts_voices_handler() -> Response {
    // Try to fetch voices from the TTS server
    let client = Client::new();
    let res = client
        .get("http://localhost:5002/api/voices")
        .send()
        .await;

    match res {
        Ok(response) if response.status().is_success() => {
            match response.json::<Vec<String>>().await {
                Ok(voices) => {
                    Response::builder()
                        .status(StatusCode::OK)
                        .header(header::CONTENT_TYPE, "application/json")
                        .body(Body::from(serde_json::to_string(&voices).unwrap()))
                        .unwrap()
                }
                Err(e) => {
                    log::warn!("Failed to parse voices response: {}", e);
                    // Fallback to default voices
                    let default_voices = vec![
                        "Samantha".to_string(),
                        "Alex".to_string(),
                        "Daniel".to_string(),
                        "Victoria".to_string(),
                        "Tom".to_string(),
                    ];
                    Response::builder()
                        .status(StatusCode::OK)
                        .header(header::CONTENT_TYPE, "application/json")
                        .body(Body::from(serde_json::to_string(&default_voices).unwrap()))
                        .unwrap()
                }
            }
        }
        Ok(response) => {
            log::warn!("TTS voices server error: {}", response.status());
            // Fallback to default voices
            let default_voices = vec![
                "Samantha".to_string(),
                "Alex".to_string(),
                "Daniel".to_string(),
                "Victoria".to_string(),
                "Tom".to_string(),
            ];
            Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_string(&default_voices).unwrap()))
                .unwrap()
        }
        Err(e) => {
            log::warn!("TTS voices connection error: {}", e);
            // Fallback to default voices
            let default_voices = vec![
                "Samantha".to_string(),
                "Alex".to_string(),
                "Daniel".to_string(),
                "Victoria".to_string(),
                "Tom".to_string(),
            ];
            Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_string(&default_voices).unwrap()))
                .unwrap()
        }
    }
} 