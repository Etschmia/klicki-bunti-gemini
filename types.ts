
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
}
