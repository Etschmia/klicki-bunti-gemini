import React, { lazy, Suspense } from 'react';
import LazyCodeBlock from './LazyCodeBlock';

// Lazy load ReactMarkdown
const ReactMarkdown = lazy(() => import('react-markdown'));

interface LazyMarkdownProps {
  children: string;
  className?: string;
  components?: Record<string, React.ComponentType<any>>;
}

const LoadingMarkdown: React.FC<{ children: string }> = ({ children }) => (
  <div className="text-gray-300 animate-pulse">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-4 h-4 bg-gray-600 rounded"></div>
      <span className="text-sm text-gray-400">Loading markdown renderer...</span>
    </div>
    <pre className="whitespace-pre-wrap text-sm bg-gray-800/30 p-2 rounded">
      {children}
    </pre>
  </div>
);

const LazyMarkdown: React.FC<LazyMarkdownProps> = ({ 
  children, 
  className, 
  components 
}) => {
  const defaultComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <LazyCodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    ...components
  };

  return (
    <Suspense fallback={<LoadingMarkdown>{children}</LoadingMarkdown>}>
      <div className={className}>
        <ReactMarkdown
          components={defaultComponents}
        >
          {children}
        </ReactMarkdown>
      </div>
    </Suspense>
  );
};

export default LazyMarkdown;