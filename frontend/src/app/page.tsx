import { ChatContainer } from '@/components/chat/chat-container';
import { MobileDrawer } from '@/components/mobile-drawer';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-0 sm:p-4 flex flex-col">
      <header className="w-full flex items-center justify-between px-4 py-3 bg-white/80 shadow-sm sticky top-0 z-30 sm:hidden">
        <MobileDrawer />
        <span className="font-bold text-lg text-blue-900">AI Doctor Assistant</span>
        <div className="w-8" />
      </header>
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        <ChatContainer />
      </div>
    </main>
  );
}
