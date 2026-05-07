import React from 'react';

interface StrategyContentFormatterProps {
  content: string;
}

export default function StrategyContentFormatter({ content }: StrategyContentFormatterProps) {
  // Parse markdown-like content and render with proper styling
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let listKey = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${listKey++}`} className="space-y-1 ml-4 mb-4">
            {currentList.map((item, i) => (
              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>{formatInlineText(item)}</span>
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    const formatInlineText = (text: string): React.ReactNode => {
      // Handle bold text with **text**
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span key={i} className="font-semibold text-yellow-400">
              {part.slice(2, -2)}
            </span>
          );
        }
        return part;
      });
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines but flush lists
      if (!trimmedLine) {
        flushList();
        return;
      }

      // Main title (# )
      if (trimmedLine.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={index} className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 mb-4 pb-2 border-b border-yellow-500/30">
            {trimmedLine.slice(2)}
          </h1>
        );
        return;
      }

      // Section title (## )
      if (trimmedLine.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={index} className="text-lg md:text-xl font-bold text-yellow-400 mt-6 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            {trimmedLine.slice(3)}
          </h2>
        );
        return;
      }

      // Subsection title (### )
      if (trimmedLine.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={index} className="text-base md:text-lg font-semibold text-amber-400 mt-4 mb-2">
            {trimmedLine.slice(4)}
          </h3>
        );
        return;
      }

      // List items (- )
      if (trimmedLine.startsWith('- ')) {
        currentList.push(trimmedLine.slice(2));
        return;
      }

      // Numbered list (1. 2. 3. etc)
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        flushList();
        elements.push(
          <div key={index} className="flex items-start gap-3 mb-2 ml-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 text-black text-xs font-bold flex items-center justify-center">
              {numberedMatch[1]}
            </span>
            <span className="text-gray-300 text-sm pt-0.5">{formatInlineText(numberedMatch[2])}</span>
          </div>
        );
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={index} className="text-gray-300 text-sm mb-2 leading-relaxed">
          {formatInlineText(trimmedLine)}
        </p>
      );
    });

    // Flush any remaining list items
    flushList();

    return elements;
  };

  return (
    <div className="space-y-1 bg-black/30 p-4 md:p-6 rounded-xl">
      {formatContent(content)}
    </div>
  );
}
