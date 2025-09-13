import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, ChatSession, MessageAuthor } from '../types';
import { storageService } from '../services/storageService';

interface UseChatHistoryReturn {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  messages: ChatMessage[];
  addMessage: (content: string, author: MessageAuthor, fileChange?: any) => ChatMessage;
  updateMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  toggleMessageFavorite: (messageId: string) => void;
  createNewSession: (name?: string) => ChatSession;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  exportCurrentSession: () => string;
  exportAllSessions: () => string;
  searchMessages: (query: string) => ChatMessage[];
  clearCurrentSession: () => void;
}

export const useChatHistory = (projectPath?: string): UseChatHistoryReturn => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Load sessions and current session on mount
  useEffect(() => {
    const loadedSessions = storageService.getChatSessions();
    setSessions(loadedSessions);

    const currentSessionId = storageService.getCurrentSession();
    if (currentSessionId) {
      const session = loadedSessions.find(s => s.id === currentSessionId);
      if (session) {
        setCurrentSession(session);
        setMessages(session.messages);
      }
    }

    // Create a new session if none exists
    if (!currentSessionId && loadedSessions.length === 0) {
      const newSession = createNewSession();
      setCurrentSession(newSession);
    }
  }, []);

  // Save current session when messages change
  useEffect(() => {
    if (currentSession && messages.length > 0) {
      const updatedSession: ChatSession = {
        ...currentSession,
        messages,
        lastUpdated: Date.now(),
        projectPath,
      };
      
      storageService.saveChatSession(updatedSession);
      
      // Update sessions list
      setSessions(prev => {
        const updated = prev.map(s => s.id === updatedSession.id ? updatedSession : s);
        if (!updated.find(s => s.id === updatedSession.id)) {
          updated.push(updatedSession);
        }
        return updated;
      });
    }
  }, [messages, currentSession, projectPath]);

  const generateMessageId = (): string => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const generateSessionId = (): string => {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addMessage = useCallback((
    content: string, 
    author: MessageAuthor, 
    fileChange?: any
  ): ChatMessage => {
    const newMessage: ChatMessage = {
      id: generateMessageId(),
      content,
      author,
      timestamp: Date.now(),
      fileChange,
      isFavorite: false,
      isEdited: false,
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const updateMessage = useCallback((messageId: string, content: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content, isEdited: true } 
        : msg
    ));
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const toggleMessageFavorite = useCallback((messageId: string) => {
    storageService.toggleMessageFavorite(messageId);
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isFavorite: !msg.isFavorite } 
        : msg
    ));
  }, []);

  const createNewSession = useCallback((name?: string): ChatSession => {
    const newSession: ChatSession = {
      id: generateSessionId(),
      name: name || `Session ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      projectPath,
    };

    setCurrentSession(newSession);
    setMessages([]);
    storageService.setCurrentSession(newSession.id);
    
    return newSession;
  }, [projectPath]);

  const loadSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      setMessages(session.messages);
      storageService.setCurrentSession(sessionId);
    }
  }, [sessions]);

  const deleteSession = useCallback((sessionId: string) => {
    storageService.deleteChatSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    
    // If current session is deleted, create a new one
    if (currentSession?.id === sessionId) {
      createNewSession();
    }
  }, [currentSession, createNewSession]);

  const exportCurrentSession = useCallback((): string => {
    if (!currentSession) return '';
    
    const sessionData = {
      ...currentSession,
      messages,
      exportedAt: new Date().toISOString(),
    };
    
    return JSON.stringify(sessionData, null, 2);
  }, [currentSession, messages]);

  const exportAllSessions = useCallback((): string => {
    return storageService.exportChatSessions();
  }, []);

  const searchMessages = useCallback((query: string): ChatMessage[] => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    return messages.filter(msg => 
      msg.content.toLowerCase().includes(searchTerm) ||
      (msg.fileChange && msg.fileChange.filePath.toLowerCase().includes(searchTerm))
    );
  }, [messages]);

  const clearCurrentSession = useCallback(() => {
    setMessages([]);
    if (currentSession) {
      const clearedSession: ChatSession = {
        ...currentSession,
        messages: [],
        lastUpdated: Date.now(),
      };
      storageService.saveChatSession(clearedSession);
    }
  }, [currentSession]);

  return {
    currentSession,
    sessions,
    messages,
    addMessage,
    updateMessage,
    deleteMessage,
    toggleMessageFavorite,
    createNewSession,
    loadSession,
    deleteSession,
    exportCurrentSession,
    exportAllSessions,
    searchMessages,
    clearCurrentSession,
  };
};