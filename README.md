# Resilient AI Agent

## Project Structure

```
resilient-ai-agent/
├── backend/      # Rust backend (Axum, MongoDB, Ollama, etc.)
├── frontend/     # Next.js frontend (React, Tailwind, shadcn/ui)
├── tts/          # Python TTS microservice (pyttsx3, Flask)
├── k8s/          # Kubernetes manifests
├── examples/     # Rust example code
└── README.md     # Project documentation
```

## How to Build & Run

### Backend
```
cd backend
cargo build
cargo run
```

### Frontend
```
cd frontend
npm install
npm run dev
```

### TTS Service
```
cd tts
./start_tts_server.sh
```

### Kubernetes
All manifests are in the `k8s/` folder.

---

## Docker Compose Deployment

You can run the entire stack (backend, frontend, tts, mongo) using Docker Compose:

```
cd backend
docker-compose up --build
```

- **backend**: Rust API (Axum, MongoDB, Ollama proxy)
- **frontend**: Next.js UI
- **tts**: Python TTS microservice (Flask, pyttsx3)
- **mongo**: MongoDB database

All services are networked together. The backend and frontend containers will wait for TTS and MongoDB to be ready.

### Accessing Services
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- TTS API: http://localhost:5002
- MongoDB: localhost:27017 (for development)

---

## Kubernetes Deployment

All Kubernetes manifests are in the `k8s/` directory. To deploy the stack:

```
kubectl apply -f k8s/
```

- **backend-deployment.yaml**: Rust API deployment, service, and secrets
- **frontend-deployment.yaml**: Next.js UI deployment and service
- **tts-deployment.yaml**: Python TTS deployment and service
- **ingress.yaml**: (Optional) Ingress for routing external traffic

### Accessing Services in Kubernetes
- Use `kubectl port-forward` or configure an ingress controller to access services from outside the cluster.
- Example:
  ```
  kubectl port-forward svc/resilient-ai-backend 3001:3001
  kubectl port-forward svc/frontend 3000:3000
  kubectl port-forward svc/tts 5002:5002
  ```

---

## Environment Variables

- **Backend**:
  - `MONGODB_URI` (default: `mongodb://mongo:27017`)
  - `TTS_URL` (default: `http://tts:5002`)
- **Frontend**:
  - `NEXT_PUBLIC_BACKEND_URL` (default: `http://backend:3001`)
  - `NEXT_PUBLIC_TTS_URL` (default: `http://tts:5002`)
- **TTS**:
  - No special env vars required (runs on port 5002)

---

## Notes
- All build artifacts for Rust are kept in `backend/target/`.
- Each service has its own Dockerfile and can be built/deployed independently.
- For production, update image tags and ingress as needed.
- For local development, you can run each service individually or use Docker Compose.

---

## Features

### Backend (Rust)
- **Async Rust**: Built with `tokio` for high performance and concurrency.
- **Ollama Integration**: Uses [`ollama-rs`](https://crates.io/crates/ollama-rs) to interact with local Ollama models.
- **Retry with Exponential Backoff**: Automatically retries failed requests with configurable backoff.
- **Circuit Breaker**: Prevents repeated failures from overwhelming the system.
- **Structured Logging**: Uses `env_logger` and `log` for clear, timestamped logs.
- **Model Availability Check**: Verifies the requested model is available before making requests.
- **REST API**: `/api/chat` for chat, `/api/health` for health check.

### Frontend (Next.js)
- **Next.js 14+** with App Router, TypeScript, and Tailwind CSS ([official guide](https://tailwindcss.com/docs/installation/framework-guides/nextjs))
- **shadcn/ui** for beautiful, accessible UI components ([docs](https://ui.shadcn.com/docs/installation))
- **Modern chat interface**: Responsive, mobile-friendly, and visually appealing
- **Live connection status**: Shows if backend/model is available
- **Avatar, Card, Input, Button, ScrollArea**: All UI built with shadcn/ui

---

## UI/UX Improvements

- The chat input is now always visible and fixed at the bottom of the page, just like a real chat app (no need to scroll to reach it).
- All footers and branding have been removed for a clean, app-like experience.

---

## Getting Started

### 1. Backend (Rust)

```sh
# In the project root
cargo run
```
- The API will be available at `http://localhost:3001`
- Endpoints:
  - `POST /api/chat` — send chat messages
  - `GET /api/health` — check model/backend status

**Requirements:**
- Rust 1.70+
- [Ollama](https://ollama.com/) running locally
- The desired model (default: `mistral`) installed:
  ```sh
  ollama pull mistral
  ```

### 2. Frontend (Next.js)

```sh
cd frontend
npm install
npm run dev
```
- The app will be available at `http://localhost:3000`
- The frontend will communicate with the backend at `http://localhost:3001`

---

## Example Usage

- Ask health questions in the chat UI
- The AI doctor will respond using the Ollama model
- Connection status is shown at the top of the chat

---

## Customization
- Change the model in `src/lib.rs` (`MODEL` constant) or pass a different prompt/system prompt.
- Adjust retry/circuit breaker settings in `src/client.rs` or via the respective config structs.
- Tweak the chat UI in `frontend/src/components/chat/` for your brand/style.

---

## Deployment

### Docker Compose (Recommended for Local/Dev)

1. Build and run both backend and frontend:

```sh
docker compose up --build
```

2. Access the frontend at `http://localhost:3000` and backend at `http://localhost:3001`.

### Docker (Manual)

#### Backend
```sh
docker build -t resilient-ai-backend .
docker run -p 3001:3001 resilient-ai-backend
```

#### Frontend
```sh
cd frontend
docker build -t resilient-ai-frontend .
docker run -p 3000:3000 resilient-ai-frontend
```

### Kubernetes

1. Apply manifests in the `k8s/` directory:
```sh
kubectl apply -f k8s/
```
2. Expose services as needed (e.g., via LoadBalancer or Ingress).

---

## Production Environment & Secrets

### Backend (Rust)
- Configure secrets (e.g., Ollama API key) via environment variables.
- In Kubernetes, use a Secret (see k8s/backend-deployment.yaml) and reference it in the deployment.
- In Docker, use `-e OLLAMA_API_KEY=...` or `--env-file`.

### Frontend (Next.js)
- Set the backend API URL via `NEXT_PUBLIC_API_URL`.
- In Kubernetes, set as an env var in the deployment.
- In Docker, use `-e NEXT_PUBLIC_API_URL=...` or `--env-file`.

### Example: Kubernetes Secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ollama-secrets
stringData:
  api-key: "your-ollama-api-key-here"
```

---

## API Endpoints

### Backend (Rust)

- `POST /api/chat`
  - **Request:**
    ```json
    { "message": "What is hypertension?" }
    ```
  - **Response:**
    ```json
    { "response": "Hypertension is...", "success": true }
    ```

- `GET /api/chats`
  - **Response:**
    ```json
    [ { "id": "...", "content": "...", "role": "user|assistant", "timestamp": "..." }, ... ]
    ```

- `GET /api/health`
  - **Response:**
    ```json
    { "status": "ok", "model": "mistral", ... }
    ```

- `GET /api/tts/voices`
  - **Response:**
    ```json
    ["Samantha", "Alex", "Daniel", ...]
    ```

- `POST /api/tts`
  - **Request:**
    ```json
    { "text": "Hello, this is a test.", "voice": "Samantha" }
    ```
  - **Response:**
    - On success: WAV audio file
    - On error: `{ "error": "TTS server unavailable" }` (Content-Type: application/json)

---

## TTS Fallback & Robustness

- If the backend cannot reach the TTS server, it returns a JSON error. The frontend automatically falls back to browser TTS (using the Web Speech API) so users always hear responses.
- TTS settings (enable/disable, mute, select voice) are available in the frontend settings page.

---

## Types of Tests

- **Unit Tests:**
  - Test individual functions, methods, or small modules in isolation.
  - Fast, do not require external systems (e.g., database, network).
  - Example: serialization/deserialization tests for types, logic in a single function.

- **Integration Tests:**
  - Test how multiple parts of the system work together.
  - May require external systems (e.g., database, TTS server).
  - Example: API endpoint tests that hit the running backend and check real responses.

- **Functional Tests:**
  - Test a specific feature or user-facing functionality end-to-end.
  - May span multiple modules or services, but focus on a user story or workflow.
  - Example: Simulate a user asking a question and receiving a spoken answer.

- **Smoke Tests:**
  - Basic tests to check that the most important parts of the system work at all.
  - Often run after deployment to catch major breakage quickly.
  - Example: Check that the backend starts and responds to `/api/health`.

---

## Running Tests

- **All tests:**
  ```sh
  cd backend
  cargo test
  ```
  This will run all unit, integration, functional, and smoke tests in `backend/tests/`.

- **Run a specific test file:**
  ```sh
  cargo test --test <test_file_name>
  # Example:
  cargo test --test types
  cargo test --test integration_api
  ```

- **Test file organization:**
  - All test files are in `backend/tests/`.
  - Each `.rs` file is a separate test crate (e.g., `types.rs`, `integration_api.rs`).
  - Add new functional or smoke tests as new files (e.g., `functional_login.rs`, `smoke_health.rs`).

---

## Credits
- [Ollama](https://ollama.com/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

## License

MIT 

---

## Kubernetes Production Deployment (AWS/EKS Example)

The `k8s/` directory now contains manifests for a full production deployment:

- `mongo-statefulset.yaml`: MongoDB StatefulSet with persistent EBS storage and secret
- `ollama-deployment.yaml`: Ollama model server with persistent EBS storage and secret
- `llama-deployment.yaml`: Llama model server (optional, separate from Ollama) with persistent EBS storage and secret
- `backend-deployment.yaml`: Rust backend API
- `frontend-deployment.yaml`: Next.js frontend
- `tts-deployment.yaml`: Python TTS microservice
- `ingress.yaml`: Ingress for HTTPS routing (uses cert-manager and nginx)

### Prerequisites
- An EKS (or other Kubernetes) cluster with storage class `gp2` (EBS)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) configured for your cluster
- [cert-manager](https://cert-manager.io/) and [nginx ingress controller](https://kubernetes.github.io/ingress-nginx/) installed (for HTTPS)

### Deploy the Full Stack
```sh
kubectl apply -f k8s/mongo-statefulset.yaml
kubectl apply -f k8s/ollama-deployment.yaml
kubectl apply -f k8s/llama-deployment.yaml # optional, if using separate Llama
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/tts-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

- All persistent data (MongoDB, Ollama, Llama models) will be stored on EBS volumes.
- Secrets for database and model API keys are managed as Kubernetes secrets.
- Ingress provides HTTPS access to the frontend and API (edit `ingress.yaml` for your domain).

### Accessing Services
- **Frontend:** https://ai.example.com/
- **Backend API:** https://ai.example.com/api
- **TTS API:** internal service `tts:5002`
- **MongoDB:** internal service `mongo:27017`
- **Ollama:** internal service `ollama:11434`
- **Llama:** internal service `llama:11435`

--- 