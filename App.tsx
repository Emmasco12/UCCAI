import React, { useState, useRef, useEffect, useCallback } from 'react';
import { geminiService } from './services/geminiService';
import { storageService } from './services/storageService';
import { ChatMessage, Role, ChatSession } from './types';
import { ChatInput } from './components/ChatInput';
import { MessageBubble } from './components/MessageBubble';
import { Sidebar } from './components/Sidebar';
import { Menu, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => {
    const loadedSessions = storageService.getSessions();
    setSessions(loadedSessions);
  }, []);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = useCallback(() => {
    geminiService.resetChat();
    setMessages([]);
    setCurrentSessionId(null);
    setIsLoading(false);
  }, []);

  const handleLoadSession = useCallback((session: ChatSession) => {
    // 1. Set messages
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    
    // 2. Re-initialize Gemini service with the history
    geminiService.initChat(session.messages);
    
    setIsLoading(false);
  }, []);

  const handleDeleteSession = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSessions = storageService.deleteSession(sessionId);
    setSessions(updatedSessions);
    
    // If the deleted session was active, reset to new chat
    if (currentSessionId === sessionId) {
      handleNewChat();
    }
  }, [currentSessionId, handleNewChat]);

  // Helper to save current state to storage
  const saveCurrentSession = (msgs: ChatMessage[], sessionId: string | null) => {
    if (msgs.length === 0) return;

    const id = sessionId || Date.now().toString();
    
    // Generate a title if it's a new session or title is default
    let title = 'New Chat';
    const firstUserMsg = msgs.find(m => m.role === Role.User);
    if (firstUserMsg) {
      title = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
    }

    const session: ChatSession = {
      id,
      title,
      messages: msgs,
      timestamp: Date.now()
    };

    const updatedSessions = storageService.saveSession(session);
    setSessions(updatedSessions);
    
    if (!sessionId) {
      setCurrentSessionId(id);
    }
    
    return id;
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: Role.User,
      text: text,
      timestamp: Date.now(),
    };

    // Update UI immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    // Save user message immediately to ensure we don't lose it if reload happens
    // We need the ID to persist through the streaming phase
    const activeSessionId = currentSessionId || Date.now().toString();
    if (!currentSessionId) setCurrentSessionId(activeSessionId);
    
    saveCurrentSession(updatedMessages, activeSessionId);

    const modelMessageId = (Date.now() + 1).toString();
    
    // Add placeholder for model response
    setMessages((prev) => [
      ...prev,
      {
        id: modelMessageId,
        role: Role.Model,
        text: '',
        isStreaming: true,
        timestamp: Date.now(),
      },
    ]);

    try {
      const stream = geminiService.sendMessageStream(text);
      
      let fullText = '';
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === modelMessageId 
              ? { ...msg, text: fullText } 
              : msg
          )
        );
      }

      // Finish streaming
      const finalMessages = messages.map((msg) => 
        msg.id === modelMessageId 
          ? { ...msg, isStreaming: false, text: fullText } // Ensure we have the latest text
          : msg
      );
      
      // Need to grab the *latest* state including the full response
      // React state updates are async, so we construct the final array manually for saving
      const completedMessages = [
        ...updatedMessages, 
        { 
          id: modelMessageId, 
          role: Role.Model, 
          text: fullText, 
          isStreaming: false, 
          timestamp: Date.now() 
        }
      ];

      setMessages(completedMessages);
      
      // Save full conversation
      saveCurrentSession(completedMessages, activeSessionId);

    } catch (error) {
      console.error(error);
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === modelMessageId 
            ? { ...msg, isStreaming: false, isError: true, text: "I'm sorry, I encountered an error while processing your request. Please check your connection or try again." } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        onNewChat={handleNewChat}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative w-full">
        
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-10 p-2 flex items-center justify-between md:hidden bg-gray-900/90 backdrop-blur-md border-b border-gray-800">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-800"
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-gray-200">UCCAI</span>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Model Selector / Header (Desktop) */}
        <div className="hidden md:flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors">
                <span className="text-lg font-semibold text-gray-200">UCCAI 2.5 Flash</span>
            </div>
            <div className="flex items-center gap-4">
                {/* Additional desktop header controls could go here */}
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar relative">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="bg-gray-800 p-4 rounded-full mb-6 shadow-xl shadow-blue-900/10">
                <Sparkles size={48} className="text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold mb-2">How can I help you today?</h1>
              <p className="text-gray-400 max-w-md">
                I'm UCCAI. I can help you write code, draft emails, analyze data, or just have a chat.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full max-w-2xl">
                 <button 
                    onClick={() => handleSend("Explain quantum computing in simple terms")}
                    className="p-4 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-gray-600 transition-all text-left"
                 >
                    <span className="font-medium block text-gray-200 mb-1">Explain quantum computing</span>
                    <span className="text-sm text-gray-500">in simple terms</span>
                 </button>
                 <button 
                    onClick={() => handleSend("Write a Python script to scrape a website")}
                    className="p-4 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-gray-600 transition-all text-left"
                 >
                    <span className="font-medium block text-gray-200 mb-1">Write a Python script</span>
                    <span className="text-sm text-gray-500">to scrape a website</span>
                 </button>
                 <button 
                    onClick={() => handleSend("Give me ideas for a 10 year old's birthday party")}
                    className="p-4 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-gray-600 transition-all text-left"
                 >
                    <span className="font-medium block text-gray-200 mb-1">Birthday party ideas</span>
                    <span className="text-sm text-gray-500">for a 10 year old</span>
                 </button>
                 <button 
                    onClick={() => handleSend("What is the difference between TCP and UDP?")}
                    className="p-4 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-gray-600 transition-all text-left"
                 >
                    <span className="font-medium block text-gray-200 mb-1">TCP vs UDP</span>
                    <span className="text-sm text-gray-500">What are the key differences?</span>
                 </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 px-4 md:px-0">
               <div className="w-full max-w-4xl">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>

      </div>
    </div>
  );
};

export default App;