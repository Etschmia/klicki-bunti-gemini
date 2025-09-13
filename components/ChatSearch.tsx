import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { ChatMessage } from '../types';

interface ChatSearchProps {
  messages: ChatMessage[];
  onSearchResults: (results: ChatMessage[]) => void;
  onClose: () => void;
}

const ChatSearch: React.FC<ChatSearchProps> = ({ messages, onSearchResults, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const results = messages.filter(message => 
        message.content.toLowerCase().includes(query) ||
        (message.fileChange && message.fileChange.filePath.toLowerCase().includes(query))
      );
      setSearchResults(results);
      setCurrentIndex(0);
      onSearchResults(results);
    } else {
      setSearchResults([]);
      onSearchResults([]);
    }
  }, [searchQuery, messages, onSearchResults]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (e.shiftKey && currentIndex > 0) {
        // Previous result
        setCurrentIndex(currentIndex - 1);
      } else if (!e.shiftKey && currentIndex < searchResults.length - 1) {
        // Next result
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < searchResults.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-800/90 border-b border-gray-700">
      <Icon name="search" className="w-4 h-4 text-gray-400" />
      
      <input
        ref={searchInputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search messages... (ESC to close, Enter to navigate)"
        className="flex-1 bg-transparent text-gray-200 placeholder-gray-400 focus:outline-none text-sm"
      />
      
      {searchResults.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>
            {currentIndex + 1} of {searchResults.length}
          </span>
          
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="p-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous result (Shift+Enter)"
          >
            <Icon name="minus" className="w-3 h-3 rotate-90" />
          </button>
          
          <button
            onClick={goToNext}
            disabled={currentIndex === searchResults.length - 1}
            className="p-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next result (Enter)"
          >
            <Icon name="plus" className="w-3 h-3 rotate-90" />
          </button>
        </div>
      )}
      
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
        title="Close search (ESC)"
      >
        <Icon name="close" className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ChatSearch;