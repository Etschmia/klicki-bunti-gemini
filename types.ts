
export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

export interface ChatMessage {
  id: string;
  author: MessageAuthor;
  content: string;
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
