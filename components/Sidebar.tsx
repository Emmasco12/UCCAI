import React from 'react';
import { Plus, MessageSquare, Settings, ExternalLink, X, Trash2, History } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onNewChat: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onLoadSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  setIsOpen, 
  onNewChat, 
  sessions, 
  currentSessionId,
  onLoadSession,
  onDeleteSession
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 bottom-0 z-30 w-[260px] bg-gray-950 flex flex-col transition-transform duration-300 ease-in-out border-r border-gray-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:static'}
      `}>
        {/* Header / New Chat */}
        <div className="p-3">
            <div className="flex items-center justify-between mb-2 md:hidden">
                 <h2 className="text-gray-200 font-semibold px-2">Menu</h2>
                 <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-white">
                    <X size={20} />
                 </button>
            </div>
          <button 
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-md border border-gray-700 hover:bg-gray-800 transition-colors text-white text-sm text-left group"
          >
            <div className="p-1 bg-white text-black rounded-full group-hover:scale-110 transition-transform">
                <Plus size={14} strokeWidth={3} />
            </div>
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
            <div className="text-xs font-semibold text-gray-500 px-3 py-2 flex items-center gap-2">
              <History size={12} />
              <span>Recent Chats</span>
            </div>
            
            <div className="flex flex-col gap-1">
              {sessions.length === 0 ? (
                <div className="px-3 py-4 text-xs text-gray-600 text-center italic">
                  No saved chats yet
                </div>
              ) : (
                sessions.map((session) => (
                  <div 
                    key={session.id}
                    className={`
                      group relative flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer transition-colors
                      ${currentSessionId === session.id ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}
                    `}
                    onClick={() => {
                      onLoadSession(session);
                      if (window.innerWidth < 768) setIsOpen(false);
                    }}
                  >
                    <MessageSquare size={16} className="flex-shrink-0" />
                    <span className="truncate text-sm pr-6 flex-1">{session.title || "New Chat"}</span>
                    
                    {/* Delete button only visible on hover (or if active on mobile) */}
                    <button 
                      onClick={(e) => onDeleteSession(session.id, e)}
                      className="absolute right-2 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete chat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800">
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-md hover:bg-gray-800 text-white text-sm transition-colors text-left">
            <Settings size={16} />
            <span>Settings</span>
          </button>
           <a 
             href="https://ai.google.dev" 
             target="_blank" 
             rel="noreferrer"
             className="w-full flex items-center gap-3 px-3 py-3 rounded-md hover:bg-gray-800 text-white text-sm transition-colors text-left"
            >
            <ExternalLink size={16} />
            <span>Gemini API Docs</span>
          </a>
          <div className="mt-2 px-3 flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500"></div>
             <div className="text-sm font-medium text-white">User</div>
          </div>
        </div>
      </div>
    </>
  );
};