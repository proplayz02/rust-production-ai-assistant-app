export interface AppSettings {
  tts: {
    muted: boolean;
    selectedVoice: string;
    enabled: boolean;
  };
  chat: {
    autoScroll: boolean;
    showTimestamps: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
  };
}

export interface VoiceOption {
  id: string;
  name: string;
  language?: string;
  gender?: 'male' | 'female';
} 