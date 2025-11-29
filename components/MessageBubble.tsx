import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, AlertCircle } from 'lucide-react';
import { ChatMessage, Role } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.User;
  const isError = message.isError;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] lg:max-w-[65%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center 
          ${isUser ? 'bg-blue-600' : isError ? 'bg-red-500' : 'bg-green-600'}
          shadow-md
        `}>
          {isUser ? (
            <User size={18} className="text-white" />
          ) : isError ? (
            <AlertCircle size={18} className="text-white" />
          ) : (
            <Bot size={18} className="text-white" />
          )}
        </div>

        {/* Bubble */}
        <div className={`
          flex flex-col 
          ${isUser ? 'items-end' : 'items-start'}
        `}>
          <div className={`
            px-4 py-3 rounded-2xl shadow-sm overflow-hidden
            ${isUser 
              ? 'bg-blue-600 text-white rounded-tr-sm' 
              : isError
                ? 'bg-red-900/50 border border-red-500/50 text-red-100 rounded-tl-sm'
                : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
            }
          `}>
            {isError ? (
              <div className="flex items-center gap-2">
                 <span>{message.text}</span>
              </div>
            ) : (
              <div className={`markdown-content text-sm md:text-base leading-relaxed break-words ${isUser ? 'text-white' : 'text-gray-100'}`}>
                {/* 
                  Note: In a production app with complex requirements, we might inject a custom renderer 
                  for code blocks to add syntax highlighting (e.g., using react-syntax-highlighter).
                  Here we rely on basic CSS styling defined in index.html for simplicity and performance.
                */}
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            )}
            
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 align-middle bg-gray-400 animate-pulse" />
            )}
          </div>
          
          <span className="text-xs text-gray-500 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};