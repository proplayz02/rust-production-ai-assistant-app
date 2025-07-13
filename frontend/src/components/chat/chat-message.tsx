import { ChatMessage } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatMessageProps {
  message: ChatMessage;
}

function formatTime(ts: Date): string {
  if (!(ts instanceof Date) || isNaN(ts.getTime())) return '';
  return ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatMessageComponent({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      {!isUser && (
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src="/doctor-avatar.png" alt="AI Doctor" />
          <AvatarFallback className="bg-blue-100 text-blue-600">👨‍⚕️</AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[75%] flex flex-col items-${isUser ? 'end' : 'start'}`}>
        <div
          className={`px-4 py-2 rounded-2xl shadow-md text-sm whitespace-pre-wrap
            ${isUser ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white text-gray-900 rounded-bl-md border'}
          `}
        >
          {message.content}
        </div>
        <span className={`text-xs mt-1 ${isUser ? 'text-blue-300' : 'text-gray-400'}`}>
          {formatTime(message.timestamp as Date)}
        </span>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 ml-2">
          <AvatarImage src="/user-avatar.png" alt="You" />
          <AvatarFallback className="bg-gray-100 text-gray-600">👤</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
} 