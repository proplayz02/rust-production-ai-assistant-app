import { ChatRequest, ChatResponse, HealthResponse, ChatMessage } from '@/types/chat';

const API_BASE_URL = 'http://localhost:3001';

type ChatMessageDoc = {
  _id?: { $oid: string } | string;
  id?: string;
  content: string;
  role: string;
  timestamp: string | Date | { $date: string };
};

function parseTimestamp(ts: string | Date | { $date: string }): Date {
  if (typeof ts === 'string') {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  if (ts instanceof Date) return ts;
  if (typeof ts === 'object' && ts && '$date' in ts) {
    const d = new Date(ts.$date);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        response: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking health:', error);
      return {
        status: 'error',
        model_available: false,
      };
    }
  }

  async fetchChats(): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ChatMessageDoc[] = await response.json();
      // Map MongoDB docs to ChatMessage
      return data.map((doc) => ({
        id: typeof doc._id === 'object' && '$oid' in doc._id ? doc._id.$oid : doc._id || doc.id || Math.random().toString(),
        content: doc.content,
        role: doc.role === 'user' ? 'user' : 'assistant',
        timestamp: parseTimestamp(doc.timestamp),
      }));
    } catch (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
  }

  async fetchTtsVoices(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tts/voices`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching TTS voices:', error);
      return [];
    }
  }

  async generateTts(text: string, voice: string): Promise<Response> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice }),
      });
      return response;
    } catch (error) {
      console.error('Error generating TTS:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient(); 