import { AppSettings } from '@/types/settings';

const DEFAULT_SETTINGS: AppSettings = {
  tts: {
    muted: false,
    selectedVoice: '',
    enabled: true,
  },
  chat: {
    autoScroll: true,
    showTimestamps: true,
  },
  appearance: {
    theme: 'light',
    fontSize: 'medium',
  },
};

const SETTINGS_KEY = 'ai-doctor-settings';

export class SettingsManager {
  private static instance: SettingsManager;
  private settings: AppSettings;
  private listeners: Set<(settings: AppSettings) => void> = new Set();

  private constructor() {
    this.settings = this.loadSettings();
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private loadSettings(): AppSettings {
    if (typeof window === 'undefined') {
      return DEFAULT_SETTINGS;
    }

    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }

    return DEFAULT_SETTINGS;
  }

  private saveSettings(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.settings));
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  updateTtsSettings(updates: Partial<AppSettings['tts']>): void {
    this.settings.tts = { ...this.settings.tts, ...updates };
    this.saveSettings();
  }

  updateChatSettings(updates: Partial<AppSettings['chat']>): void {
    this.settings.chat = { ...this.settings.chat, ...updates };
    this.saveSettings();
  }

  updateAppearanceSettings(updates: Partial<AppSettings['appearance']>): void {
    this.settings.appearance = { ...this.settings.appearance, ...updates };
    this.saveSettings();
  }

  subscribe(listener: (settings: AppSettings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }
}

export const settingsManager = SettingsManager.getInstance(); 