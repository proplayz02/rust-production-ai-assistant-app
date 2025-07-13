"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const trimmedMessage = message.trim();
    setMessage('');
    await onSendMessage(trimmedMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
        flex gap-2 p-2 border-t bg-white
        fixed bottom-0 left-0 w-full z-20
        md:static md:p-4 md:z-auto
        max-w-full
      "
      style={{ boxShadow: '0 -2px 16px 0 rgba(0,0,0,0.04)' }}
    >
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Ask me about your health concerns..."
        className="min-h-[48px] max-h-[120px] resize-none flex-1 rounded-full px-4 py-2 text-base"
        disabled={isLoading}
        rows={1}
      />
      <Button
        type="submit"
        disabled={!message.trim() || isLoading}
        className="rounded-full h-12 w-12 p-0 flex items-center justify-center self-end bg-blue-600 hover:bg-blue-700 transition"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </form>
  );
} 