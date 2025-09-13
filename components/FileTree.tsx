
import React, { useState, useEffect } from 'react';
import { FileSystemItem, FileItem, DirectoryItem } from '../types';
import { Icon } from './Icon';
import { getFileMetadata, formatFileSize, getLanguageInfo } from '../utils/fileUtils';

interface FileTreeProps {
    item: FileSystemItem;
    onFileClick: (file: FileItem) => void;
    activeFile: FileItem | null;
}

const FileTree: React.FC<FileTreeProps> = ({ item, onFileClick, activeFile }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [fileSize, setFileSize] = useState<string | null>(null);
    const [isConfig, setIsConfig] = useState(false);
    const [languageInfo, setLanguageInfo] = useState<{ icon: string; color: string }>({ icon: 'file', color: '#6b7280' });

    const isDirectory = item.kind === 'directory';
    const isActive = activeFile?.path === item.path;

    // Load file metadata for files
    useEffect(() => {
        if (item.kind === 'file') {
            const loadMetadata = async () => {
                try {
                    const metadata = await getFileMetadata(item.handle);
                    setFileSize(formatFileSize(metadata.size));
                    setIsConfig(metadata.isConfig);
                    const langInfo = getLanguageInfo(item.name);
                    setLanguageInfo(langInfo);
                } catch (error) {
                    console.warn(`Failed to load metadata for ${item.name}:`, error);
                }
            };
            loadMetadata();
        }
    }, [item]);

    const handleToggle = () => {
        if (isDirectory) {
            setIsOpen(!isOpen);
        }
    };

    const handleFileClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent folder from toggling when a file is clicked
        if (!isDirectory) {
            onFileClick(item as FileItem);
        }
    };

    const itemClass = `
        flex items-center p-1.5 text-sm rounded-md cursor-pointer group
        hover:bg-gray-700/50 transition-colors duration-150
        ${isActive ? 'bg-purple-600/30 text-purple-300' : 'text-gray-300'}
        ${isConfig ? 'border-l-2 border-yellow-500/50' : ''}
    `;

    return (
        <div className="ml-4">
            <div className={itemClass} onClick={isDirectory ? handleToggle : handleFileClick}>
                <Icon 
                    name={isDirectory ? 'folder' : 'file'} 
                    className="w-5 h-5 mr-2 flex-shrink-0" 
                    style={!isDirectory && languageInfo ? { color: languageInfo.color } : undefined}
                />
                <span className="truncate flex-1">{item.name}</span>
                
                {/* File size and config indicator */}
                {!isDirectory && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isConfig && (
                            <span className="px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-mono">CFG</span>
                        )}
                        {fileSize && (
                            <span className="font-mono">{fileSize}</span>
                        )}
                    </div>
                )}
            </div>
            {isDirectory && isOpen && (
                <div className="pl-4 border-l border-gray-600/50">
                    {(item as DirectoryItem).children?.map((child: FileSystemItem) => (
                        <FileTree key={child.path} item={child} onFileClick={onFileClick} activeFile={activeFile} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileTree;
