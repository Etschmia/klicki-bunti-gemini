
import React, { useState, useCallback, useMemo } from 'react';
import { ChatMessage, MessageAuthor, FileItem } from './types';
import { useFileTree } from './hooks/useFileTree';
import { generateResponseStream } from './services/geminiService';
import ChatInterface from './components/ChatInterface';
import DirectoryPicker from './components/DirectoryPicker';
import FileTree from './components/FileTree';
import { Icon } from './components/Icon';

const App: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'initial-message',
            author: MessageAuthor.SYSTEM,
            content: `**Willkommen bei Klicki-Bunti Gemini!**

Ich bin ein KI-Assistent, der Ihnen bei Ihren Programmieraufgaben helfen kann.

**Erste Schritte:**
1.  Klicken Sie auf **"Verzeichnis auswählen"**, um mir Kontext über Ihr Projekt zu geben.
2.  Ich werde die Dateistruktur anzeigen. Klicken Sie auf eine Datei, um deren Inhalt zu meinem Kontext hinzuzufügen.
3.  Stellen Sie mir eine Frage zu Ihrem Code!

*Hinweis: Diese App verwendet die moderne File System Access API Ihres Browsers, um sicher auf lokale Dateien zuzugreifen. Ihre Dateien verlassen Ihren Computer nicht, außer denen, die Sie aktiv als Kontext für eine Anfrage auswählen.*`
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const { fileTree, rootName, openDirectoryPicker, isLoading: isTreeLoading, error: treeError } = useFileTree();
    const [activeFile, setActiveFile] = useState<FileItem | null>(null);
    const [activeFileContent, setActiveFileContent] = useState<string | null>(null);

    const handleFileClick = useCallback(async (file: FileItem) => {
        try {
            setActiveFile(file);
            const fileHandle = await file.handle.getFile();
            const content = await fileHandle.text();
            setActiveFileContent(content);
            setMessages(prev => [...prev, {
                id: `file-context-${Date.now()}`,
                author: MessageAuthor.SYSTEM,
                content: `Kontext aktualisiert. Aktive Datei ist jetzt **${file.name}**. Ich werde den Inhalt dieser Datei bei meiner nächsten Antwort berücksichtigen.`
            }]);
        } catch (e) {
            const error = e as Error;
            setMessages(prev => [...prev, {
                id: `file-error-${Date.now()}`,
                author: MessageAuthor.SYSTEM,
                content: `Fehler beim Lesen der Datei ${file.name}: ${error.message}`
            }]);
            setActiveFile(null);
            setActiveFileContent(null);
        }
    }, []);

    const handleSendMessage = useCallback(async (prompt: string) => {
        if (!prompt || isLoading) return;

        setIsLoading(true);
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            author: MessageAuthor.USER,
            content: prompt,
        };
        const aiMessageId = `ai-${Date.now()}`;
        setMessages(prev => [...prev, userMessage, { id: aiMessageId, author: MessageAuthor.AI, content: '...' }]);

        try {
            const stream = await generateResponseStream(prompt, fileTree, activeFile ? { name: activeFile.name, content: activeFileContent ?? '' } : null);

            let fullResponse = '';
            setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, content: '' } : msg));

            for await (const chunk of stream) {
                fullResponse += chunk;
                setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, content: fullResponse } : msg));
            }
        } catch (e) {
            const error = e as Error;
            setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, content: `Entschuldigung, ein Fehler ist aufgetreten: ${error.message}` } : msg));
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, fileTree, activeFile, activeFileContent]);

    const memoizedFileTree = useMemo(() => {
        return fileTree ? <FileTree item={fileTree} onFileClick={handleFileClick} activeFile={activeFile} /> : null;
    }, [fileTree, handleFileClick, activeFile]);

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200">
            <aside className="w-1/4 max-w-sm min-w-[280px] bg-gray-800/50 flex flex-col p-4 border-r border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                     <Icon name="gemini" className="h-8 w-8 text-purple-400" />
                     <h1 className="text-xl font-bold">Klicki-Bunti Gemini</h1>
                </div>
                <DirectoryPicker onOpen={openDirectoryPicker} directoryName={rootName} isLoading={isTreeLoading} />
                {treeError && <p className="text-red-400 text-sm mt-2">{treeError}</p>}
                <div className="mt-4 flex-1 overflow-y-auto pr-2">
                    {isTreeLoading ? <p>Lade Verzeichnis...</p> : memoizedFileTree}
                </div>
            </aside>
            <main className="flex-1 flex flex-col h-screen">
                <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                />
            </main>
        </div>
    );
};

export default App;
