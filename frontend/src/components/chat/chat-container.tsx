"use client";

import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { ChatMessageComponent } from './chat-message';
import { ChatInput } from './chat-input';
import { apiClient } from '@/lib/api';
import { settingsManager } from '@/lib/settings';
import { AlertCircle, CheckCircle, ArrowDown, Volume2, VolumeX } from 'lucide-react';

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef<number>(0);
  const [settings, setSettings] = useState(() => settingsManager.getSettings());
  const [voices, setVoices] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Subscribe to settings changes
    const unsubscribe = settingsManager.subscribe((newSettings) => {
      setSettings(newSettings);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    checkConnection();
    (async () => {
      const chats = await apiClient.fetchChats();
      if (chats.length > 0) {
        setMessages(chats);
      } else {
        setMessages([
          {
            id: 'welcome',
            content:
              "Hello! I'm your AI doctor assistant. I can help answer your health questions and provide general medical information. Please note that I'm not a replacement for professional medical advice. What can I help you with today?",
            role: 'assistant',
            timestamp: new Date(),
          },
        ]);
      }
    })();
  }, []);

  const checkConnection = async () => {
    try {
      const health = await apiClient.checkHealth();
      setIsConnected(health.model_available);
    } catch {
      setIsConnected(false);
    }
  };

  // Helper: is user at (or near) the bottom?
  const isAtBottom = () => {
    if (!scrollContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 80;
  };

  // Track if a new message arrived while not at bottom
  const [hasNewMessage, setHasNewMessage] = useState(false);
  // Track if last message was from user
  const lastMessageFromUser = messages.length > 0 && messages[messages.length - 1].role === 'user';

  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      if (lastMessageFromUser) {
        // Always scroll to bottom for user's own messages
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
        setHasNewMessage(false);
      } else {
        // For assistant messages, only scroll if user is at/near bottom
        if (scrollContainerRef.current && isAtBottom()) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
          setHasNewMessage(false);
        } else {
          setHasNewMessage(true);
        }
      }
    }
    prevMessageCount.current = messages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowScrollToBottom(scrollHeight - scrollTop - clientHeight > 80);
      // Hide new message indicator if user scrolls to bottom
      if (scrollHeight - scrollTop - clientHeight < 80) {
        setHasNewMessage(false);
      }
    };
    const ref = scrollContainerRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll);
      handleScroll();
    }
    
    return () => {
      if (ref) ref.removeEventListener('scroll', handleScroll);
    };
  }, [messages]);

  const handleScrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
      setHasNewMessage(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiClient.sendMessage({ message: content });
      
      if (response.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: response.response,
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `Sorry, I encountered an error: ${response.error || 'Unknown error'}. Please try again.`,
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please check if the backend server is running.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available voices from Piper (if supported)
  useEffect(() => {
    apiClient.fetchTtsVoices()
      .then(voices => {
        if (voices.length > 0) {
          setVoices(voices);
          // Set first voice as default if none selected
          if (!settings.tts.selectedVoice) {
            settingsManager.updateTtsSettings({ selectedVoice: voices[0] });
          }
        }
      })
      .catch(() => {});
  }, [settings.tts.selectedVoice]);

  // Play TTS for new assistant messages
  useEffect(() => {
    if (!settings.tts.enabled || settings.tts.muted || messages.length < 2) return; // skip if disabled, muted, or initial load
    const last = messages[messages.length - 1];
    const prev = messages[messages.length - 2];
    if (last.role === 'assistant' && prev.role !== 'assistant') {
      // Try Piper TTS first, fallback to browser TTS
      apiClient.generateTts(last.content, settings.tts.selectedVoice)
        .then(res => {
          if (res.ok) {
            return res.blob();
          } else {
            // If TTS server is unavailable, return null to trigger browser fallback
            return null;
          }
        })
        .then(blob => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
            audio.onended = () => URL.revokeObjectURL(url);
          } else {
            // Fallback to browser TTS
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(last.content);
              utterance.rate = 0.9;
              utterance.pitch = 1.0;
              utterance.volume = 0.8;
              speechSynthesis.speak(utterance);
            }
          }
        })
        .catch(() => {
          // Fallback to browser TTS on error
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(last.content);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            speechSynthesis.speak(utterance);
          }
        });
    }
  }, [messages, settings.tts.enabled, settings.tts.muted, settings.tts.selectedVoice]);

  // Mute/unmute toggle
  const handleMuteToggle = () => {
    settingsManager.updateTtsSettings({ muted: !settings.tts.muted });
  };

  // Don't render TTS controls until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="w-full h-[100dvh] sm:h-[80vh] flex flex-col rounded-none sm:rounded-2xl bg-white/80 shadow-2xl overflow-hidden border-0">
        <div className="border-b bg-white/90 backdrop-blur z-10 sticky top-0 px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👨‍⚕️</span>
            <span className="font-bold text-base sm:text-lg">AI Doctor Assistant</span>
          </div>
        </div>
        <div className="flex-1 min-h-0 relative flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-1 sm:px-4 py-2 sm:py-4 gap-1 bg-gradient-to-b from-white/80 to-blue-50 pb-24">
            {messages.map((message) => (
              <ChatMessageComponent key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 w-full z-30 bg-white/95 backdrop-blur border-t shadow-md">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] sm:h-[80vh] flex flex-col rounded-none sm:rounded-2xl bg-white/80 shadow-2xl overflow-hidden border-0">
      {/* TTS Controls */}
      <div className="flex items-center justify-end gap-4 px-4 py-2 bg-white/80 border-b">
        <button
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
          onClick={handleMuteToggle}
          aria-label={settings.tts.muted ? 'Unmute TTS' : 'Mute TTS'}
        >
          {settings.tts.muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          <span className="text-xs">{settings.tts.muted ? 'Muted' : 'Speak'}</span>
        </button>
        {voices.length > 0 && (
          <select
            className="border rounded px-2 py-1 text-xs"
            value={settings.tts.selectedVoice}
            onChange={e => settingsManager.updateTtsSettings({ selectedVoice: e.target.value })}
            aria-label="Select TTS voice"
          >
            {voices.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        )}
      </div>
      <div className="border-b bg-white/90 backdrop-blur z-10 sticky top-0 px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👨‍⚕️</span>
          <span className="font-bold text-base sm:text-lg">AI Doctor Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Disconnected</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 relative flex flex-col">
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto flex flex-col px-1 sm:px-4 py-2 sm:py-4 gap-1 bg-gradient-to-b from-white/80 to-blue-50 pb-24"
        >
          {messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          )}
        </div>
        {showScrollToBottom && (
          <button
            className="absolute right-4 bottom-24 z-20 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700 transition"
            onClick={handleScrollToBottom}
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        )}
      </div>
      {/* Show new message indicator if not at bottom */}
      {hasNewMessage && (
        <button
          className="fixed right-4 bottom-32 z-40 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition"
          onClick={handleScrollToBottom}
          aria-label="Scroll to latest message"
        >
          <ArrowDown className="h-6 w-6" />
        </button>
      )}
      {/* Fixed chat input at the bottom of the viewport */}
      <div className="fixed bottom-0 left-0 w-full z-30 bg-white/95 backdrop-blur border-t shadow-md">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
} 