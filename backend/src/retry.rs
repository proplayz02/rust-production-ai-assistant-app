use std::time::Duration;
use tokio::time::sleep;
use log::{warn, info};

#[derive(Debug, Clone)]
pub struct RetryConfig {
    pub max_attempts: usize,
    pub initial_delay: Duration,
    pub max_delay: Duration,
    pub backoff_multiplier: f64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_attempts: 3,
            initial_delay: Duration::from_millis(100),
            max_delay: Duration::from_secs(30),
            backoff_multiplier: 2.0,
        }
    }
}

pub async fn with_retry<T, E, F, Fut>(
    config: &RetryConfig,
    operation: F,
) -> Result<T, E>
where
    F: Fn() -> Fut,
    Fut: std::future::Future<Output = Result<T, E>>,
    E: std::fmt::Display,
{
    let mut attempt = 0;
    let mut delay = config.initial_delay;

    loop {
        attempt += 1;
        
        match operation().await {
            Ok(result) => {
                if attempt > 1 {
                    info!("Operation succeeded on attempt {}", attempt);
                }
                return Ok(result);
            }
            Err(e) => {
                warn!("Attempt {} failed: {}", attempt, e);
                
                if attempt >= config.max_attempts {
                    return Err(e);
                }

                info!("Retrying in {:?}...", delay);
                sleep(delay).await;

                // Calculate next delay with exponential backoff
                delay = Duration::from_secs_f64(
                    (delay.as_secs_f64() * config.backoff_multiplier)
                        .min(config.max_delay.as_secs_f64())
                );
            }
        }
    }
}

// Generic async retry for any async operation (e.g., MongoDB)
pub async fn retry_async_with_backoff<T, E, Fut, F>(
    mut operation: F,
    max_attempts: usize,
    initial_delay: Duration,
    backoff_factor: f64,
) -> Result<T, E>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<T, E>>,
    E: std::fmt::Display,
{
    let mut attempt = 0;
    let mut delay = initial_delay;
    loop {
        attempt += 1;
        match operation().await {
            Ok(val) => return Ok(val),
            Err(e) => {
                warn!("Retry {}/{} failed: {}", attempt, max_attempts, e);
                if attempt >= max_attempts {
                    return Err(e);
                }
                sleep(delay).await;
                delay = Duration::from_secs_f64((delay.as_secs_f64() * backoff_factor).min(30.0));
            }
        }
    }
} 