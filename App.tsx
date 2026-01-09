import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Send, Zap, Brain, Globe, StopCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { geminiService } from './services/geminiService';
import { Message, Role, ModelId, ChatSession, ChatMode, Theme } from './types';

const App: React.FC = () => {
  // --- State ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Replaces separate model/thinking states with a unified mode
  const [mode, setMode] = useState<ChatMode>('flash');
  const [theme, setTheme] = useState<Theme>('dark');
  
  // --- Refs ---
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Derived State ---
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Helper to determine config based on mode
  const getModeConfig = (m: ChatMode) => {
    switch (m) {
        case 'reasoning':
            return { modelId: ModelId.PRO, thinking: true, search: false };
        case 'search':
            // Using FLASH for search as it is fast and supports grounding well
            return { modelId: ModelId.FLASH, thinking: false, search: true };
        case 'flash':
        default:
            return { modelId: ModelId.FLASH, thinking: false, search: false };
    }
  };

  const currentConfig = getModeConfig(mode);

  // --- Effects ---
  
  // Theme Toggle Effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Handlers ---

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
    return newSession;
  }, []);

  const handleSendMessage = async (messageOverride?: string) => {
    const textToSend = messageOverride || input;
    if (!textToSend.trim() || isLoading) return;

    let session = currentSession;
    if (!session) {
      session = createNewSession();
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: Role.USER,
      content: textToSend.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...(session?.messages || []), userMessage];
    
    setSessions(prev => prev.map(s => 
      s.id === session!.id 
        ? { ...s, messages: newMessages, title: s.messages.length === 0 ? textToSend.trim().slice(0, 30) : s.title } 
        : s
    ));

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    const history = newMessages.slice(0, -1).map(m => ({
        role: m.role === Role.USER ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    const botMessageId = uuidv4();
    const botMessage: Message = {
        id: botMessageId,
        role: Role.MODEL,
        content: '',
        timestamp: Date.now()
    };
    
    setSessions(prev => prev.map(s => 
        s.id === session!.id 
          ? { ...s, messages: [...newMessages, botMessage] } 
          : s
    ));

    try {
        const config = getModeConfig(mode);
        await geminiService.startChat(config.modelId, history, config.thinking, config.search);
        
        const stream = geminiService.sendMessageStream(userMessage.content);
        
        let fullContent = '';
        
        for await (const chunk of stream) {
            if (chunk.text) {
                fullContent += chunk.text;
            }

            setSessions(prev => prev.map(s => {
                if (s.id !== session!.id) return s;
                return {
                    ...s,
                    messages: s.messages.map(m => 
                        m.id === botMessageId 
                        ? { 
                            ...m, 
                            content: fullContent,
                            // Only update metadata if present in chunk, otherwise keep existing
                            groundingMetadata: chunk.groundingMetadata || m.groundingMetadata 
                          }
                        : m
                    )
                };
            }));
        }

    } catch (error) {
        console.error("Failed to generate response", error);
        setSessions(prev => prev.map(s => {
            if (s.id !== session!.id) return s;
            return {
                ...s,
                messages: s.messages.map(m => 
                    m.id === botMessageId 
                    ? { ...m, content: "**Error:** Failed to communicate with the model. Please check your connection or API key." }
                    : m
                )
            };
        }));
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getPlaceholderText = () => {
      if (isLoading) return "Generating response...";
      if (mode === 'search') return "Ask a question to search the web...";
      if (mode === 'reasoning') return "Ask a complex reasoning question...";
      return "Message UCCAI...";
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-200">
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={createNewSession}
        onSelectSession={(id) => {
            setCurrentSessionId(id);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        onDeleteSession={handleDeleteSession}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-full w-full max-w-full">
        
        {/* Header */}
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-10 shrink-0 transition-colors duration-200">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
                >
                    <Menu size={20} />
                </button>
                <div className="flex items-center gap-1 cursor-pointer group relative">
                    <span className="font-semibold text-lg tracking-tight text-gray-800 dark:text-gray-100">UCCAI</span>
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-mono px-1.5 py-0.5 rounded ml-2 border border-gray-200 dark:border-gray-700">BETA</span>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg transition-colors duration-200">
                <button 
                    onClick={() => setMode('flash')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        mode === 'flash' 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                    <Zap size={14} className={mode === 'flash' ? "fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400" : ""} />
                    Flash
                </button>
                <button 
                    onClick={() => setMode('reasoning')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        mode === 'reasoning'
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                    <Brain size={14} className={mode === 'reasoning' ? "text-indigo-200" : ""} />
                    Reasoning
                </button>
                <button 
                    onClick={() => setMode('search')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        mode === 'search'
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                    <Globe size={14} className={mode === 'search' ? "text-blue-200" : ""} />
                    Search
                </button>
            </div>
        </header>

        {/* Chat Area */}
        <ChatArea 
            messages={messages} 
            isLoading={isLoading} 
            modelId={currentConfig.modelId}
            onPromptClick={(prompt) => handleSendMessage(prompt)}
        />

        {/* Input Area */}
        <div className="w-full shrink-0 p-4 md:p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-gray-900 dark:via-gray-900 transition-colors duration-200">
            <div className="max-w-3xl mx-auto relative">
                <div className="relative flex items-end bg-white dark:bg-[#2f3336] rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all overflow-hidden">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={getPlaceholderText()}
                        className="w-full max-h-[200px] py-3.5 pl-4 pr-12 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none overflow-y-auto scrollbar-thin"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleSendMessage()}
                        disabled={!input.trim() || isLoading}
                        className={`absolute right-2 bottom-2 p-2 rounded-lg transition-colors ${
                            input.trim() && !isLoading
                            ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md' 
                            : 'bg-transparent text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                    >
                       {isLoading ? (
                           <StopCircle size={18} className="animate-pulse text-gray-400" />
                       ) : (
                           <Send size={18} />
                       )}
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-500">
                        UCCAI can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default App;