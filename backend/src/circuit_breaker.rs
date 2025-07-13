use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use log::{warn, info, error};

#[derive(Debug, Clone, PartialEq, Copy)]
pub enum CircuitState {
    Closed,    // Normal operation
    Open,      // Circuit is open, requests fail fast
    HalfOpen,  // Testing if service is back
}

#[derive(Debug)]
pub struct CircuitBreaker {
    state: Arc<RwLock<CircuitState>>,
    failure_count: Arc<RwLock<usize>>,
    last_failure_time: Arc<RwLock<Option<Instant>>>,
    config: CircuitBreakerConfig,
}

#[derive(Debug, Clone)]
pub struct CircuitBreakerConfig {
    pub failure_threshold: usize,
    pub timeout: Duration,
    pub success_threshold: usize,
}

impl Default for CircuitBreakerConfig {
    fn default() -> Self {
        Self {
            failure_threshold: 5,
            timeout: Duration::from_secs(60),
            success_threshold: 2,
        }
    }
}

impl CircuitBreaker {
    pub fn new(config: CircuitBreakerConfig) -> Self {
        Self {
            state: Arc::new(RwLock::new(CircuitState::Closed)),
            failure_count: Arc::new(RwLock::new(0)),
            last_failure_time: Arc::new(RwLock::new(None)),
            config,
        }
    }

    pub async fn call<T, E, F, Fut>(&self, operation: F) -> Result<T, CircuitBreakerError>
    where
        F: Fn() -> Fut,
        Fut: std::future::Future<Output = Result<T, E>>,
        E: std::fmt::Display,
    {
        let state = *self.state.read().await;
        
        match state {
            CircuitState::Open => {
                let last_failure = *self.last_failure_time.read().await;
                if let Some(failure_time) = last_failure {
                    if failure_time.elapsed() >= self.config.timeout {
                        info!("Circuit breaker timeout reached, transitioning to half-open");
                        *self.state.write().await = CircuitState::HalfOpen;
                        return self.call_without_recursion(operation).await;
                    }
                }
                return Err(CircuitBreakerError::CircuitOpen);
            }
            CircuitState::HalfOpen | CircuitState::Closed => {
                match operation().await {
                    Ok(result) => {
                        self.on_success().await;
                        Ok(result)
                    }
                    Err(e) => {
                        self.on_failure().await;
                        Err(CircuitBreakerError::OperationFailed(e.to_string()))
                    }
                }
            }
        }
    }

    async fn call_without_recursion<T, E, F, Fut>(&self, operation: F) -> Result<T, CircuitBreakerError>
    where
        F: Fn() -> Fut,
        Fut: std::future::Future<Output = Result<T, E>>,
        E: std::fmt::Display,
    {
        match operation().await {
            Ok(result) => {
                self.on_success().await;
                Ok(result)
            }
            Err(e) => {
                self.on_failure().await;
                Err(CircuitBreakerError::OperationFailed(e.to_string()))
            }
        }
    }

    async fn on_success(&self) {
        let mut state = self.state.write().await;
        let mut failure_count = self.failure_count.write().await;
        
        match *state {
            CircuitState::HalfOpen => {
                *failure_count = 0;
                *state = CircuitState::Closed;
                info!("Circuit breaker closed after successful operation");
            }
            CircuitState::Closed => {
                *failure_count = 0;
            }
            CircuitState::Open => {}
        }
    }

    async fn on_failure(&self) {
        let mut state = self.state.write().await;
        let mut failure_count = self.failure_count.write().await;
        let mut last_failure_time = self.last_failure_time.write().await;
        
        *failure_count += 1;
        *last_failure_time = Some(Instant::now());
        
        match *state {
            CircuitState::Closed => {
                if *failure_count >= self.config.failure_threshold {
                    *state = CircuitState::Open;
                    error!("Circuit breaker opened after {} failures", *failure_count);
                }
            }
            CircuitState::HalfOpen => {
                *state = CircuitState::Open;
                error!("Circuit breaker opened after failure in half-open state");
            }
            CircuitState::Open => {}
        }
    }

    pub async fn get_state(&self) -> CircuitState {
        *self.state.read().await
    }
}

#[derive(Debug, thiserror::Error)]
pub enum CircuitBreakerError {
    #[error("Circuit breaker is open")]
    CircuitOpen,
    #[error("Operation failed: {0}")]
    OperationFailed(String),
} 