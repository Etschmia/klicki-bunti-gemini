import React, { useState } from 'react';

// Lazy load the syntax highlighter with dynamic imports for individual languages
const loadSyntaxHighlighter = () => 
  import('react-syntax-highlighter').then(module => module.Prism);

// Import commonly used styles statically (small file)
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface LazyCodeBlockProps {
  language: string;
  value: string;
}

const LoadingCodeBlock: React.FC<{ value: string }> = ({ value }) => (
  <div className="relative bg-gray-800 rounded-md my-2">
    <div className="flex items-center justify-between px-4 py-1 bg-gray-700/50 rounded-t-md">
      <span className="text-xs text-gray-400">Loading syntax highlighter...</span>
    </div>
    <pre className="p-4 overflow-x-auto text-sm bg-gray-800 rounded-b-md">
      <code className="text-gray-300">{value}</code>
    </pre>
  </div>
);

const LazyCodeBlock: React.FC<LazyCodeBlockProps> = ({ language, value }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [SyntaxHighlighter, setSyntaxHighlighter] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const loadHighlighter = async () => {
    if (SyntaxHighlighter || isLoading) return;
    
    setIsLoading(true);
    try {
      const highlighter = await loadSyntaxHighlighter();
      setSyntaxHighlighter(() => highlighter);
    } catch (error) {
      console.error('Failed to load syntax highlighter:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    // Load syntax highlighter when component mounts
    loadHighlighter();
  }, []);

  if (!SyntaxHighlighter && !isLoading) {
    // Show loading state before highlighter is loaded
    return <LoadingCodeBlock value={value} />;
  }

  if (!SyntaxHighlighter) {
    // Still loading
    return <LoadingCodeBlock value={value} />;
  }

  return (
    <div className="relative bg-gray-800 rounded-md my-2">
      <div className="flex items-center justify-between px-4 py-1 bg-gray-700/50 rounded-t-md">
        <span className="text-xs text-gray-400">{language}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          {isCopied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={atomDark}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 6px 6px',
          fontSize: '14px'
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export default LazyCodeBlock;