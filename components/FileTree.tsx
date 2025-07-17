
import React, { useState } from 'react';
import { FileItem } from '../types';
import { Icon } from './Icon';

interface FileTreeProps {
    item: FileItem;
    onFileClick: (file: FileItem) => void;
    activeFile: FileItem | null;
}

const FileTree: React.FC<FileTreeProps> = ({ item, onFileClick, activeFile }) => {
    const [isOpen, setIsOpen] = useState(true);

    const isDirectory = item.kind === 'directory';
    const isActive = activeFile?.path === item.path;

    const handleToggle = () => {
        if (isDirectory) {
            setIsOpen(!isOpen);
        }
    };

    const handleFileClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent folder from toggling when a file is clicked
        if (!isDirectory) {
            onFileClick(item);
        }
    };

    const itemClass = `
        flex items-center p-1.5 text-sm rounded-md cursor-pointer 
        hover:bg-gray-700/50 transition-colors duration-150
        ${isActive ? 'bg-purple-600/30 text-purple-300' : 'text-gray-300'}
    `;

    return (
        <div className="ml-4">
            <div className={itemClass} onClick={isDirectory ? handleToggle : handleFileClick}>
                <Icon name={isDirectory ? 'folder' : 'file'} className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
            </div>
            {isDirectory && isOpen && (
                <div className="pl-4 border-l border-gray-600/50">
                    {item.children?.map(child => (
                        <FileTree key={child.path} item={child} onFileClick={onFileClick} activeFile={activeFile} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileTree;
