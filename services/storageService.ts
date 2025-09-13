import { ChatSession, UserSettings, ThemeConfig } from '../types';

// Storage keys
const STORAGE_KEYS = {
  CHAT_SESSIONS: 'klicki-bunti-chat-sessions',
  USER_SETTINGS: 'klicki-bunti-user-settings',
  CURRENT_SESSION: 'klicki-bunti-current-session',
  FAVORITES: 'klicki-bunti-favorites',
} as const;

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  theme: {
    mode: 'dark',
    colorScheme: 'default',
    viewMode: 'comfortable',
    fontSize: 'medium',
    sidebarWidth: 320,
  },
  chatSettings: {
    enableHistory: true,
    maxHistorySize: 100,
    autoSave: true,
  },
  fileSettings: {
    showHiddenFiles: false,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    respectGitignore: true,
  },
};

class StorageService {
  private isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private safeGetItem<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to parse localStorage item ${key}:`, error);
      return defaultValue;
    }
  }

  private safeSetItem<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) return false;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Failed to set localStorage item ${key}:`, error);
      return false;
    }
  }

  // User Settings Management
  getUserSettings(): UserSettings {
    return this.safeGetItem(STORAGE_KEYS.USER_SETTINGS, DEFAULT_SETTINGS);
  }

  updateUserSettings(settings: Partial<UserSettings>): boolean {
    const currentSettings = this.getUserSettings();
    const newSettings = { ...currentSettings, ...settings };
    return this.safeSetItem(STORAGE_KEYS.USER_SETTINGS, newSettings);
  }

  updateThemeSettings(theme: Partial<ThemeConfig>): boolean {
    const currentSettings = this.getUserSettings();
    const newSettings = {
      ...currentSettings,
      theme: { ...currentSettings.theme, ...theme },
    };
    return this.safeSetItem(STORAGE_KEYS.USER_SETTINGS, newSettings);
  }

  // Chat Sessions Management
  getChatSessions(): ChatSession[] {
    return this.safeGetItem(STORAGE_KEYS.CHAT_SESSIONS, []);
  }

  saveChatSession(session: ChatSession): boolean {
    const sessions = this.getChatSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = { ...session, lastUpdated: Date.now() };
    } else {
      sessions.push(session);
    }

    // Maintain max session limit
    const maxSessions = this.getUserSettings().chatSettings.maxHistorySize;
    if (sessions.length > maxSessions) {
      sessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
      sessions.splice(maxSessions);
    }

    return this.safeSetItem(STORAGE_KEYS.CHAT_SESSIONS, sessions);
  }

  deleteChatSession(sessionId: string): boolean {
    const sessions = this.getChatSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    return this.safeSetItem(STORAGE_KEYS.CHAT_SESSIONS, filteredSessions);
  }

  getCurrentSession(): string | null {
    return this.safeGetItem(STORAGE_KEYS.CURRENT_SESSION, null);
  }

  setCurrentSession(sessionId: string): boolean {
    return this.safeSetItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);
  }

  // Favorites Management
  getFavoriteMessages(): string[] {
    return this.safeGetItem(STORAGE_KEYS.FAVORITES, []);
  }

  toggleMessageFavorite(messageId: string): boolean {
    const favorites = this.getFavoriteMessages();
    const index = favorites.indexOf(messageId);
    
    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push(messageId);
    }
    
    return this.safeSetItem(STORAGE_KEYS.FAVORITES, favorites);
  }

  isMessageFavorite(messageId: string): boolean {
    return this.getFavoriteMessages().includes(messageId);
  }

  // Export/Import functionality
  exportChatSessions(): string {
    const sessions = this.getChatSessions();
    const settings = this.getUserSettings();
    
    return JSON.stringify({
      sessions,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }, null, 2);
  }

  importChatSessions(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.sessions && Array.isArray(data.sessions)) {
        this.safeSetItem(STORAGE_KEYS.CHAT_SESSIONS, data.sessions);
      }
      
      if (data.settings) {
        this.safeSetItem(STORAGE_KEYS.USER_SETTINGS, data.settings);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import chat sessions:', error);
      return false;
    }
  }

  // Clear all data
  clearAllData(): boolean {
    if (!this.isAvailable()) return false;
    
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();