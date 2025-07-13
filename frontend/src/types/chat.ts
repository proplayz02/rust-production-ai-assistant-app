export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  system_prompt?: string;
}

export interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
}

export interface HealthResponse {
  status: string;
  model_available: boolean;
} 