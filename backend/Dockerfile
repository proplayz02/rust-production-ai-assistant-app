# ---- Build Stage ----
FROM rust:1.70 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

# ---- Runtime Stage ----
FROM debian:bullseye-slim
WORKDIR /app
# Create non-root user
RUN useradd -m appuser
COPY --from=builder /app/target/release/resilient-ai-agent /app/resilient-ai-agent
COPY ./Cargo.toml ./Cargo.toml
COPY ./Cargo.lock ./Cargo.lock
EXPOSE 3001
ENV RUST_LOG=info
USER appuser
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1
CMD ["/app/resilient-ai-agent"] 