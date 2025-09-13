
export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

export interface FileItem {
    kind: 'file';
    name: string;
    handle: FileSystemFileHandle;
    path: string;
}

export interface DirectoryItem {
    kind: 'directory';
    name: string;
    handle: FileSystemDirectoryHandle;
    children: FileSystemItem[];
    path: string;
}

export type FileSystemItem = FileItem | DirectoryItem;

export interface FileChange {
  filePath: string;
  newContent: string;
  type: 'create' | 'update';
}

export interface ChatMessage {
  id: string;
  author: MessageAuthor;
  content: string;
  fileChange?: FileChange; // Optional file change proposal
  timestamp: number;
  isFavorite?: boolean;
  isEdited?: boolean;
}

// Theme and Customization Types
export type ThemeMode = 'light' | 'dark';
export type ColorScheme = 'default' | 'vscode' | 'github' | 'monokai';
export type ViewMode = 'compact' | 'comfortable';
export type FontSize = 'small' | 'medium' | 'large';

export interface ThemeConfig {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  viewMode: ViewMode;
  fontSize: FontSize;
  sidebarWidth: number;
}

// Settings and Preferences Types
export interface UserSettings {
  theme: ThemeConfig;
  chatSettings: {
    enableHistory: boolean;
    maxHistorySize: number;
    autoSave: boolean;
  };
  fileSettings: {
    showHiddenFiles: boolean;
    maxFileSize: number; // in bytes
    respectGitignore: boolean;
  };
}

// Chat History Types
export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: number;
  lastUpdated: number;
  projectPath?: string;
}

// File Analysis Types
export interface FileMetadata {
  size: number;
  type: string;
  isConfig: boolean;
  language?: string;
  lastModified: number;
}

export interface ProjectInfo {
  name: string;
  type: 'react' | 'node' | 'typescript' | 'javascript' | 'unknown';
  packageInfo?: {
    name: string;
    version: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
  };
  readme?: string;
  gitignorePatterns?: string[];
}

// Enhanced File Item with metadata
export interface EnhancedFileItem extends FileItem {
  metadata?: FileMetadata;
  isSelected?: boolean;
}

export interface EnhancedDirectoryItem extends DirectoryItem {
  children: EnhancedFileSystemItem[];
}

export type EnhancedFileSystemItem = EnhancedFileItem | EnhancedDirectoryItem;
