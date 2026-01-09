import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="markdown-body text-sm md:text-base leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            const codeString = String(children).replace(/\n$/, '');

            if (isInline) {
               return <code className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm" {...props}>{children}</code>;
            }

            // Generate a somewhat unique ID for the code block to track copy state
            // In a real app, use a proper ID generation or index from map if available
            // Here we just use a simple random check or pass index if we could intercept it better.
            // Simplified: we'll just show the copy button.
            
            return (
              <div className="relative group my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0d1117]">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700/50 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-mono">{match?.[1] || 'code'}</span>
                  <button
                    onClick={() => handleCopy(codeString, Math.random())} // Simple hack for now
                    className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                   {/* We can't easily track index here without context, so standard Copy icon */}
                    <Copy size={14} />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-4 overflow-x-auto">
                    <code className={`${className} !bg-transparent text-gray-800 dark:text-gray-300 font-mono text-sm block`} {...props}>
                    {children}
                    </code>
                </div>
              </div>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;