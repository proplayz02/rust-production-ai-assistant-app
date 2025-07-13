# Next.js Frontend for Resilient AI Agent

## Getting Started

```sh
npm install
npm run dev
```

## Docker

Build and run the frontend:
```sh
docker build -t resilient-ai-frontend .
docker run -p 3000:3000 resilient-ai-frontend
```

## Kubernetes

1. Apply manifests in the `k8s/` directory (if available):
```sh
kubectl apply -f k8s/
```
2. Expose the frontend service as needed (e.g., via LoadBalancer or Ingress).

## Configuration
- The frontend expects the backend API at `http://localhost:3001` by default. Set the API URL via environment variables if deploying in production.
