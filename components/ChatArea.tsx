import React, { useEffect, useRef } from 'react';
import { Message, Role, ModelId, GroundingMetadata } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { Bot, User, Sparkles, Globe, ExternalLink } from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  modelId: ModelId;
  onPromptClick?: (prompt: string) => void;
}

const SourcesDisplay: React.FC<{ metadata: GroundingMetadata }> = ({ metadata }) => {
    if (!metadata.groundingChunks || metadata.groundingChunks.length === 0) return null;

    // Deduplicate sources based on URI
    const uniqueSources = metadata.groundingChunks.reduce((acc, chunk) => {
        if (chunk.web?.uri && !acc.find(s => s.web?.uri === chunk.web?.uri)) {
            acc.push(chunk);
        }
        return acc;
    }, [] as typeof metadata.groundingChunks);

    if (uniqueSources.length === 0) return null;

    return (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                <Globe size={12} />
                <span>Sources</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {uniqueSources.map((chunk, idx) => (
                    chunk.web && (
                        <a 
                            key={idx} 
                            href={chunk.web.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-200 dark:border-gray-700 max-w-[200px] truncate"
                        >
                            <span className="truncate">{chunk.web.title || new URL(chunk.web.uri).hostname}</span>
                            <ExternalLink size={10} className="shrink-0 opacity-50" />
                        </a>
                    )
                ))}
            </div>
        </div>
    );
};

const ChatArea: React.FC<ChatAreaProps> = ({ messages, isLoading, modelId, onPromptClick }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 px-4 transition-colors duration-200">
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-full mb-6 ring-1 ring-black/5 dark:ring-white/10">
          <Sparkles size={32} className="text-indigo-500 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">How can I help you today?</h2>
        <p className="text-center max-w-md mb-8 text-gray-600 dark:text-gray-400">
            UCCAI is powered by <strong>Google Gemini</strong>. 
            Choose <strong>Flash</strong> for speed, <strong>Reasoning</strong> for deep thinking, or <strong>Search</strong> for web-grounded answers.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
            {[
                "Who won the last Super Bowl?",
                "Analyze the latest trends in AI",
                "Write a Python script to scrape a website",
                "Explain quantum computing to a 5-year old"
            ].map((prompt, i) => (
                <button 
                    key={i} 
                    onClick={() => onPromptClick?.(prompt)}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer transition-all text-sm text-gray-600 dark:text-gray-300 text-left"
                >
                    {prompt}
                </button>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
      <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 md:gap-6 ${
              message.role === Role.USER ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === Role.USER 
                ? 'bg-gray-200 dark:bg-gray-700' 
                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
            }`}>
              {message.role === Role.USER ? (
                <User size={18} className="text-gray-600 dark:text-gray-200" />
              ) : (
                <Bot size={18} className="text-white" />
              )}
            </div>

            <div className={`flex flex-col min-w-0 max-w-[85%] md:max-w-[90%] ${message.role === Role.USER ? 'items-end' : 'items-start'}`}>
                <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
                    {message.role === Role.USER ? 'You' : 'UCCAI'}
                </div>
                
                {message.role === Role.USER ? (
                    <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-4 py-2.5 rounded-2xl rounded-tr-sm">
                        <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                ) : (
                    <div className="w-full text-gray-800 dark:text-gray-100">
                         <MarkdownRenderer content={message.content} />
                         {message.groundingMetadata && <SourcesDisplay metadata={message.groundingMetadata} />}
                    </div>
                )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 md:gap-6">
             <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
                <Bot size={18} className="text-white" />
             </div>
             <div className="flex flex-col justify-center">
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                </div>
             </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
};

export default ChatArea;