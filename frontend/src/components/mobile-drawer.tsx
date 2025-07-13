"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, History, Settings, Info } from 'lucide-react';

export function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="p-2 rounded-md hover:bg-blue-100 transition" aria-label="Open menu">
          <Menu className="h-6 w-6 text-blue-600" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 bg-white">
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <span className="text-2xl">👨‍⚕️</span>
            <span className="font-bold text-lg text-blue-900">AI Doctor Assistant</span>
          </div>
          <nav className="flex-1 flex flex-col gap-2 p-4">
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-900 text-base font-medium">
              <History className="h-5 w-5" /> Chat History
            </button>
            <button
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-900 text-base font-medium"
              onClick={() => {
                setOpen(false);
                router.push('/settings');
              }}
            >
              <Settings className="h-5 w-5" /> Settings
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-900 text-base font-medium">
              <Info className="h-5 w-5" /> About
            </button>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
} 