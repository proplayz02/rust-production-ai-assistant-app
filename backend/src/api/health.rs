use axum::{extract::State, Json, http::StatusCode};
use crate::state::AppState;
use crate::types::HealthResponse;

pub async fn health_handler(
    State(state): State<AppState>,
) -> Result<Json<HealthResponse>, StatusCode> {
    let model_available = state.client.check_model_availability().await
        .unwrap_or(false);
    Ok(Json(HealthResponse {
        status: "ok".to_string(),
        model_available,
    }))
} 