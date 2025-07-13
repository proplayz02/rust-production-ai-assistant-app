use resilient_ai_agent::circuit_breaker::{CircuitBreaker, CircuitBreakerConfig, CircuitState};
use std::time::Duration;

#[tokio::test]
async fn test_circuit_breaker_config_default() {
    let config = CircuitBreakerConfig::default();
    assert_eq!(config.failure_threshold, 5);
    assert_eq!(config.timeout, Duration::from_secs(60));
    assert_eq!(config.success_threshold, 2);
}

#[tokio::test]
async fn test_circuit_breaker_initial_state() {
    let config = CircuitBreakerConfig::default();
    let breaker = CircuitBreaker::new(config);
    let state = breaker.get_state().await;
    assert_eq!(state, CircuitState::Closed);
} 