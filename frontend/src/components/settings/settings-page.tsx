"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { settingsManager } from '@/lib/settings';
import { apiClient } from '@/lib/api';
import { AppSettings } from '@/types/settings';
import { ArrowLeft, Volume2, VolumeX, MessageSquare, Palette, RotateCcw } from 'lucide-react';

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(settingsManager.getSettings());
  const [voices, setVoices] = useState<string[]>([]);

  // Subscribe to settings changes
  useEffect(() => {
    const unsubscribe = settingsManager.subscribe((newSettings) => {
      setSettings(newSettings);
    });
    return unsubscribe;
  }, []);

  // Fetch available voices
  useEffect(() => {
    apiClient.fetchTtsVoices()
      .then(voices => {
        if (voices.length > 0) {
          setVoices(voices);
        }
      })
      .catch(() => {
        console.log('No TTS voices available');
      });
  }, []);

  // Set default voice if not set
  useEffect(() => {
    if (voices.length > 0 && !settings.tts.selectedVoice) {
      settingsManager.updateTtsSettings({ selectedVoice: voices[0] });
    }
  }, [voices, settings.tts.selectedVoice]);

  const handleTtsToggle = () => {
    settingsManager.updateTtsSettings({ enabled: !settings.tts.enabled });
  };

  const handleMuteToggle = () => {
    settingsManager.updateTtsSettings({ muted: !settings.tts.muted });
  };

  const handleVoiceChange = (voice: string) => {
    settingsManager.updateTtsSettings({ selectedVoice: voice });
  };

  const handleAutoScrollToggle = () => {
    settingsManager.updateChatSettings({ autoScroll: !settings.chat.autoScroll });
  };

  const handleTimestampsToggle = () => {
    settingsManager.updateChatSettings({ showTimestamps: !settings.chat.showTimestamps });
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    settingsManager.updateAppearanceSettings({ theme });
  };

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    settingsManager.updateAppearanceSettings({ fontSize });
  };

  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      settingsManager.resetToDefaults();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-blue-900">Settings</h1>
        </div>

        {/* TTS Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {settings.tts.enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              Text-to-Speech
            </CardTitle>
            <CardDescription>
              Configure voice settings for the AI assistant&apos;s voice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Enable TTS</h3>
                <p className="text-sm text-gray-600">Play audio for assistant responses</p>
              </div>
              <Button
                variant={settings.tts.enabled ? "default" : "outline"}
                size="sm"
                onClick={handleTtsToggle}
              >
                {settings.tts.enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            {settings.tts.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Mute Audio</h3>
                    <p className="text-sm text-gray-600">Temporarily disable audio playback</p>
                  </div>
                  <Button
                    variant={settings.tts.muted ? "default" : "outline"}
                    size="sm"
                    onClick={handleMuteToggle}
                  >
                    {settings.tts.muted ? "Muted" : "Unmuted"}
                  </Button>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Voice Selection</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {voices.map((voice) => (
                      <Button
                        key={voice}
                        variant={settings.tts.selectedVoice === voice ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleVoiceChange(voice)}
                        className="justify-start"
                      >
                        {voice}
                      </Button>
                    ))}
                  </div>
                  {voices.length === 0 && (
                    <p className="text-sm text-gray-500">No voices available</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Chat Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat Settings
            </CardTitle>
            <CardDescription>
              Configure chat behavior and display options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Auto-scroll to new messages</h3>
                <p className="text-sm text-gray-600">Automatically scroll to latest messages</p>
              </div>
              <Button
                variant={settings.chat.autoScroll ? "default" : "outline"}
                size="sm"
                onClick={handleAutoScrollToggle}
              >
                {settings.chat.autoScroll ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Show timestamps</h3>
                <p className="text-sm text-gray-600">Display message timestamps</p>
              </div>
              <Button
                variant={settings.chat.showTimestamps ? "default" : "outline"}
                size="sm"
                onClick={handleTimestampsToggle}
              >
                {settings.chat.showTimestamps ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the app&apos;s appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Theme</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'dark', 'auto'] as const).map((theme) => (
                  <Button
                    key={theme}
                    variant={settings.appearance.theme === theme ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleThemeChange(theme)}
                    className="capitalize"
                  >
                    {theme}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Font Size</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <Button
                    key={size}
                    variant={settings.appearance.fontSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFontSizeChange(size)}
                    className="capitalize"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reset Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <RotateCcw className="h-5 w-5" />
              Reset Settings
            </CardTitle>
            <CardDescription>
              Reset all settings to their default values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleResetSettings}
            >
              Reset to Defaults
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 