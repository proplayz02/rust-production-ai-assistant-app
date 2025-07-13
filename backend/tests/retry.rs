use resilient_ai_agent::retry::{RetryConfig, with_retry};
use std::time::Duration;
use std::sync::Arc;
use tokio::sync::Mutex;

#[tokio::test]
async fn test_retry_config_default() {
    let config = RetryConfig::default();
    assert_eq!(config.max_attempts, 3);
    assert_eq!(config.initial_delay, Duration::from_millis(100));
    assert_eq!(config.max_delay, Duration::from_secs(30));
    assert_eq!(config.backoff_multiplier, 2.0);
}

#[tokio::test]
async fn test_with_retry_success() {
    let config = RetryConfig::default();
    let attempts = Arc::new(Mutex::new(0));
    let attempts_clone = attempts.clone();
    let result: Result<u32, &str> = with_retry(&config, move || {
        let attempts = attempts_clone.clone();
        async move {
            let mut lock = attempts.lock().await;
            *lock += 1;
            if *lock < 2 {
                Err("fail")
            } else {
                Ok(42)
            }
        }
    }).await;
    assert_eq!(result.unwrap(), 42);
    assert_eq!(*attempts.lock().await, 2);
} 