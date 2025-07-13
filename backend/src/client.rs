use crate::consts::{MODEL, DEFAULT_SYSTEM_MOCK};
use crate::Result;
use crate::retry::{RetryConfig, with_retry};
use crate::circuit_breaker::{CircuitBreaker, CircuitBreakerConfig, CircuitBreakerError};
use crate::logging::{self, log_operation_start, log_operation_success, log_operation_failure, log_model_request};
use ollama_rs::Ollama;
use ollama_rs::generation::completion::request::GenerationRequest;
use std::time::Instant;

pub struct ResilientOllamaClient {
    ollama: Ollama,
    circuit_breaker: CircuitBreaker,
    retry_config: RetryConfig,
}

impl ResilientOllamaClient {
    pub fn new() -> Self {
        let circuit_config = CircuitBreakerConfig {
            failure_threshold: 3,
            timeout: std::time::Duration::from_secs(30),
            success_threshold: 1,
        };
        
        let retry_config = RetryConfig {
            max_attempts: 3,
            initial_delay: std::time::Duration::from_millis(500),
            max_delay: std::time::Duration::from_secs(10),
            backoff_multiplier: 2.0,
        };

        Self {
            ollama: Ollama::default(),
            circuit_breaker: CircuitBreaker::new(circuit_config),
            retry_config,
        }
    }

    pub async fn generate(&self, prompt: String, system_prompt: Option<String>) -> Result<String> {
        let start_time = Instant::now();
        let operation_name = "ollama_generate";
        
        log_operation_start(operation_name, &format!("prompt length: {}", prompt.len()));
        log_model_request(MODEL, prompt.len());

        let result = self.circuit_breaker.call(|| async {
            with_retry(&self.retry_config, || async {
                self.perform_generation(&prompt, system_prompt.as_deref()).await
            }).await
        }).await;

        match result {
            Ok(response) => {
                let duration = start_time.elapsed();
                log_operation_success(operation_name, duration);
                Ok(response)
            }
            Err(CircuitBreakerError::CircuitOpen) => {
                log_operation_failure(operation_name, "Circuit breaker is open");
                Err("Service temporarily unavailable due to circuit breaker".into())
            }
            Err(CircuitBreakerError::OperationFailed(e)) => {
                log_operation_failure(operation_name, &e);
                Err(e.into())
            }
        }
    }

    async fn perform_generation(&self, prompt: &str, system_prompt: Option<&str>) -> Result<String> {
        let model = MODEL.to_string();
        let mut request = GenerationRequest::new(model, prompt.to_string());
        
        if let Some(system) = system_prompt {
            request = request.system(system.to_string());
        }

        let response = self.ollama.generate(request).await
            .map_err(|e| format!("Ollama generation failed: {}", e))?;
        
        Ok(response.response)
    }

    pub async fn check_model_availability(&self) -> Result<bool> {
        let operation_name = "model_availability_check";
        log_operation_start(operation_name, MODEL);

        let result = self.circuit_breaker.call(|| async {
            with_retry(&self.retry_config, || async {
                self.perform_model_check().await
            }).await
        }).await;

        match result {
            Ok(available) => {
                log_operation_success(operation_name, std::time::Duration::from_millis(0));
                Ok(available)
            }
            Err(CircuitBreakerError::CircuitOpen) => {
                log_operation_failure(operation_name, "Circuit breaker is open");
                Ok(false)
            }
            Err(CircuitBreakerError::OperationFailed(e)) => {
                log_operation_failure(operation_name, &e);
                Ok(false)
            }
        }
    }

    async fn perform_model_check(&self) -> Result<bool> {
        // Try to list models to check if Ollama is available
        match self.ollama.list_local_models().await {
            Ok(models) => {
                let model_names: Vec<String> = models.into_iter()
                    .map(|m| m.name)
                    .collect();
                
                let available = model_names.iter().any(|name| name == MODEL);
                if !available {
                    log::warn!("Model '{}' not found. Available models: {:?}", MODEL, model_names);
                }
                Ok(available)
            }
            Err(e) => {
                log::error!("Failed to check model availability: {}", e);
                Err(format!("Model availability check failed: {}", e).into())
            }
        }
    }
}

impl Default for ResilientOllamaClient {
    fn default() -> Self {
        Self::new()
    }
} 