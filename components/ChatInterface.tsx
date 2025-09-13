import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageAuthor, FileChange } from '../types';
import { Icon } from './Icon';
import ChatSearch from './ChatSearch';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { exportChatToMarkdown, downloadAsFile, copyToClipboard, generateExportFilename } from '../utils/exportUtils';

interface ChatInterfaceProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    onAcceptFileChange: (change: FileChange) => void;
    onRejectFileChange: () => void;
    onEditMessage?: (messageId: string, content: string) => void;
    onDeleteMessage?: (messageId: string) => void;
    onToggleFavorite?: (messageId: string) => void;
    sessionName?: string;
    onExportChat?: () => void;
    onClearChat?: () => void;
}

const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="relative bg-gray-800 rounded-md my-2">
            <div className="flex items-center justify-between px-4 py-1 bg-gray-700/50 rounded-t-md">
                <span className="text-xs font-sans text-gray-400">{language || 'code'}</span>
                <button onClick={handleCopy} className="flex items-center text-xs text-gray-400 hover:text-white">
                    <Icon name={isCopied ? 'check' : 'copy'} className="w-4 h-4 mr-1" />
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <SyntaxHighlighter style={atomDark} language={language} PreTag="div">
                {String(value).replace(/\n$/, '')}
            </SyntaxHighlighter>
        </div>
    );
};

const FileChangeProposal: React.FC<{
    fileChange: FileChange;
    onAccept: () => void;
    onReject: () => void;
}> = ({ fileChange, onAccept, onReject }) => {
    return (
        <div className="border-l-4 border-yellow-500 pl-4 mt-4">
            <p className="font-bold text-yellow-400">Vorschlag zur Dateiänderung:</p>
            <div className="text-sm bg-gray-800/50 p-2 rounded-md mt-2">
                <p><span className="font-semibold">Aktion:</span> {fileChange.type === 'create' ? 'Datei erstellen' : 'Datei aktualisieren'}</p>
                <p><span className="font-semibold">Pfad:</span> {fileChange.filePath}</p>
            </div>
            <p className="mt-2">Möchten Sie diese Änderung anwenden?</p>
            <div className="flex gap-4 mt-2">
                <button onClick={onAccept} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm font-bold flex items-center gap-2">
                    <Icon name="check" className="w-4 h-4" />
                    Änderung anwenden
                </button>
                <button onClick={onReject} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-bold flex items-center gap-2">
                    <Icon name="close" className="w-4 h-4" />
                    Ablehnen
                </button>
            </div>
        </div>
    )
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
    messages, 
    onSendMessage, 
    isLoading, 
    onAcceptFileChange, 
    onRejectFileChange,
    onEditMessage,
    onDeleteMessage,
    onToggleFavorite,
    sessionName,
    onExportChat,
    onClearChat
}) => {
    const [input, setInput] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleSend = () => {
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleExportMarkdown = () => {
        const markdown = exportChatToMarkdown(messages, sessionName);
        const filename = generateExportFilename(sessionName, 'md');
        downloadAsFile(markdown, filename, 'text/markdown');
        setShowExportMenu(false);
    };

    const handleCopyChat = async () => {
        const markdown = exportChatToMarkdown(messages, sessionName);
        const success = await copyToClipboard(markdown);
        if (success) {
            // You could add a toast notification here
            console.log('Chat copied to clipboard!');
        }
        setShowExportMenu(false);
    };

    const handleClearChat = () => {
        if (confirm('Are you sure you want to clear the current chat? This action cannot be undone.')) {
            onClearChat?.();
        }
        setShowExportMenu(false);
    };

    const handleSearchResults = (results: ChatMessage[]) => {
        setSearchResults(results);
        if (results.length > 0) {
            setHighlightedMessageId(results[0].id);
            // Scroll to first result
            const element = document.getElementById(`message-${results[0].id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            setHighlightedMessageId(null);
        }
    };

    const handleCloseSearch = () => {
        setShowSearch(false);
        setSearchResults([]);
        setHighlightedMessageId(null);
    };

    const handleOpenSearch = () => {
        setShowSearch(true);
        setShowExportMenu(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-200">
                        {sessionName || 'Chat Session'}
                    </h2>
                    <span className="text-sm text-gray-400">({messages.length} messages)</span>
                </div>
                
                <div className="relative">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleOpenSearch}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                            title="Search messages"
                        >
                            <Icon name="search" className="w-5 h-5" />
                        </button>
                        
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                            title="Export options"
                        >
                            <Icon name="download" className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {showExportMenu && (
                        <div className="absolute right-0 top-12 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-2 min-w-48 z-10">
                            <button
                                onClick={handleExportMarkdown}
                                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 flex items-center gap-2"
                            >
                                <Icon name="download" className="w-4 h-4" />
                                Export as Markdown
                            </button>
                            <button
                                onClick={handleCopyChat}
                                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 flex items-center gap-2"
                            >
                                <Icon name="copy" className="w-4 h-4" />
                                Copy to Clipboard
                            </button>
                            <hr className="border-gray-700 my-1" />
                            <button
                                onClick={handleClearChat}
                                className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700/50 flex items-center gap-2"
                            >
                                <Icon name="trash" className="w-4 h-4" />
                                Clear Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Search Component */}
            {showSearch && (
                <ChatSearch
                    messages={messages}
                    onSearchResults={handleSearchResults}
                    onClose={handleCloseSearch}
                />
            )}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        id={`message-${msg.id}`}
                        className={`flex items-start gap-4 ${msg.author === MessageAuthor.USER ? 'justify-end' : ''} ${
                            highlightedMessageId === msg.id ? 'ring-2 ring-yellow-400 rounded-lg p-2 -m-2' : ''
                        }`}
                    >
                        {msg.author !== MessageAuthor.USER && (
                            <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                                <Icon name="gemini" className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div className={`max-w-2xl p-4 rounded-lg shadow-md ${msg.author === MessageAuthor.USER ? 'bg-blue-600/50' : 'bg-gray-700/50'} prose prose-invert prose-sm max-w-none relative group`}>
                            {/* Message Actions */}
                            {(onEditMessage || onDeleteMessage || onToggleFavorite) && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    {onToggleFavorite && (
                                        <button
                                            onClick={() => onToggleFavorite(msg.id)}
                                            className={`p-1 rounded text-xs hover:bg-gray-600/50 ${
                                                msg.isFavorite ? 'text-yellow-400' : 'text-gray-400'
                                            }`}
                                            title={msg.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                        >
                                            <Icon name={msg.isFavorite ? 'star-filled' : 'star'} className="w-3 h-3" />
                                        </button>
                                    )}
                                    {onEditMessage && msg.author === MessageAuthor.USER && (
                                        <button
                                            onClick={() => {
                                                const newContent = prompt('Edit message:', msg.content);
                                                if (newContent !== null && newContent !== msg.content) {
                                                    onEditMessage(msg.id, newContent);
                                                }
                                            }}
                                            className="p-1 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-600/50"
                                            title="Edit message"
                                        >
                                            <Icon name="edit" className="w-3 h-3" />
                                        </button>
                                    )}
                                    {onDeleteMessage && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this message?')) {
                                                    onDeleteMessage(msg.id);
                                                }
                                            }}
                                            className="p-1 rounded text-xs text-gray-400 hover:text-red-400 hover:bg-gray-600/50"
                                            title="Delete message"
                                        >
                                            <Icon name="trash" className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            )}
                            
                            {/* Message timestamp and edit indicator */}
                            <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                {msg.isEdited && <span className="italic">(edited)</span>}
                                {msg.isFavorite && <Icon name="star-filled" className="w-3 h-3 text-yellow-400" />}
                            </div>
                            <ReactMarkdown
                                components={{
                                    code({ node, inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                                        ) : (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                }}
                            >
                                {msg.content}
                            </ReactMarkdown>
                            {msg.fileChange && (
                                <FileChangeProposal
                                    fileChange={msg.fileChange}
                                    onAccept={() => onAcceptFileChange(msg.fileChange!)}
                                    onReject={onRejectFileChange}
                                />
                            )}
                        </div>
                         {msg.author === MessageAuthor.USER && (
                            <div className="w-8 h-8 flex-shrink-0 bg-gray-700 rounded-full flex items-center justify-center">
                                <Icon name="user" className="w-5 h-5 text-gray-300" />
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-gray-800/50 border-t border-gray-700/50">
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Stellen Sie eine Frage..."
                        className="w-full bg-gray-700 text-gray-200 rounded-lg p-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white"
                    >
                        <Icon name="send" className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
