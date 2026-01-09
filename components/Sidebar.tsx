import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, X, Settings, Menu, Search, Moon, Sun } from 'lucide-react';
import { ChatSession, Theme } from '../types';

interface SidebarProps {
  isOpen: boolean;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  toggleSidebar: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  toggleSidebar,
  theme,
  toggleTheme,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter sessions based on title OR content of messages
  const filteredSessions = sessions.filter(session => {
    const term = searchTerm.toLowerCase();
    const titleMatch = session.title.toLowerCase().includes(term);
    const contentMatch = session.messages.some(m => m.content.toLowerCase().includes(term));
    return titleMatch || contentMatch;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-gray-50 dark:bg-gray-950 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 border-r border-gray-200 dark:border-gray-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${!isOpen && 'md:hidden'}`} // Hide completely on desktop if closed via state logic usually controlled by parent, but here we just use transform
      >
        <div className="p-3 pb-0 flex items-center justify-between md:hidden">
            <div className="font-bold text-gray-800 dark:text-gray-200 px-2">UCCAI</div>
            <button onClick={toggleSidebar} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <X size={20} />
            </button>
        </div>

        {/* New Chat Button & Search */}
        <div className="p-3 pb-2 space-y-3">
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-200 text-left shadow-sm dark:shadow-none"
          >
            <Plus size={16} />
            <span>New chat</span>
          </button>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-200/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 text-xs rounded-md py-2 pl-9 pr-2 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 focus:bg-white dark:focus:bg-gray-900 placeholder-gray-500 dark:placeholder-gray-600 transition-all"
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
          <div className="text-xs font-semibold text-gray-500 mb-2 px-2">
            {searchTerm ? 'Search Results' : 'Recent'}
          </div>
          {filteredSessions.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-600 px-2 italic">
                {searchTerm ? 'No chats found.' : 'No history yet.'}
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group flex items-center gap-2 px-3 py-3 rounded-md cursor-pointer transition-colors text-sm ${
                  session.id === currentSessionId
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-900'
                }`}
              >
                <MessageSquare size={16} className="shrink-0" />
                <span className="truncate flex-1">{session.title}</span>
                {session.id === currentSessionId && (
                    <button
                        onClick={(e) => onDeleteSession(e, session.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity p-1"
                        title="Delete chat"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* User / Settings Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <div className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer transition-colors text-sm text-gray-700 dark:text-gray-200">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                U
             </div>
             <div className="flex-1">
                <div className="font-medium">User</div>
                <div className="text-xs text-gray-500">Pro Plan</div>
             </div>
             <Settings size={16} className="text-gray-400" />
          </div>
          
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer transition-colors text-sm text-gray-700 dark:text-gray-200"
          >
             <div className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
             </div>
             <span className="flex-1 text-left">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;