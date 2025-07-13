use resilient_ai_agent::logging::init_logging;

#[test]
fn test_init_logging_does_not_panic() {
    // Should not panic when initializing logging
    let _ = std::panic::catch_unwind(|| {
        init_logging();
    });
} 