import React, { useState, useRef, useEffect } from 'react';
import { Send, StopCircle, Mic, MicOff } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef(''); // Stores text before recording starts

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      // Cap max height at around 200px
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            alert("Microphone permission denied. Please allow microphone access in your browser settings to use voice input.");
          }
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          // Combine base text with the current session's transcript
          const spacing = baseTextRef.current && !baseTextRef.current.endsWith(' ') ? ' ' : '';
          const currentTranscript = finalTranscript + interimTranscript;
          
          if (currentTranscript) {
             setInput(baseTextRef.current + spacing + currentTranscript);
          }
        };

        recognitionRef.current = recognition;
      }
    }

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Save current input so we can append to it
      baseTextRef.current = input;
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        setIsListening(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      if (isListening) {
        // Just stop listening, don't toggle (which might restart)
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }
      onSend(input);
      setInput('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-gray-900">
      <div className={`
        relative flex items-end gap-2 bg-gray-800 border rounded-xl shadow-lg p-2 
        transition-all duration-200
        ${isListening ? 'border-red-500/50 ring-2 ring-red-500/20' : 'border-gray-700 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500'}
      `}>
        
        <button 
          onClick={toggleListening}
          className={`
            p-2 rounded-lg transition-all duration-200
            ${isListening 
              ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20 animate-pulse' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }
          `}
          title={isListening ? "Stop recording" : "Start voice input"}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Message UCCAI..."}
          disabled={isLoading}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-gray-500 text-base p-2 min-h-[44px] max-h-[200px] resize-none focus:outline-none disabled:opacity-50 scrollbar-hide"
          style={{ overflowY: input.length > 100 ? 'auto' : 'hidden' }}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={`
            p-2 rounded-lg transition-all duration-200 flex-shrink-0 mb-0.5
            ${input.trim() && !isLoading 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? <StopCircle size={20} className="animate-pulse" /> : <Send size={20} />}
        </button>
      </div>
      <div className="text-center mt-2 text-xs text-gray-500">
        UCCAI can make mistakes. Consider checking important information.
      </div>
    </div>
  );
};