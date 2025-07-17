
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
}

export interface DirectoryItem {
    kind: 'directory';
    name: string;
    handle: FileSystemDirectoryHandle;
    children: FileSystemItem[];
}

export type FileSystemItem = FileItem | DirectoryItem;
