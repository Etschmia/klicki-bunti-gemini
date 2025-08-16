
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ChatMessage, MessageAuthor, FileItem, FileSystemItem, FileChange } from './types';
import { useFileTree } from './hooks/useFileTree';
import { generateResponseStream } from './services/geminiService';
import * as fileService from './services/fileService';
import ChatInterface from './components/ChatInterface';
import DirectoryPicker from './components/DirectoryPicker';
import FileTree from './components/FileTree';
import { Icon } from './components/Icon';

const findFileInTree = (item: FileSystemItem, fileName: string): FileItem | null => {
    if (item.kind === 'file') {
        return item.name === fileName ? item : null;
    }
    if (item.kind === 'directory' && item.children) {
        for (const child of item.children) {
            const found = findFileInTree(child, fileName);
            if (found) return found;
        }
    }
    return null;
};

const parseFileChange = (response: string): { fileChange: FileChange | null, cleanedResponse: string } => {
    const fileOpRegex = /```json:file-op\n([\s\S]+?)\n```/;
    const match = response.match(fileOpRegex);

    if (match && match[1]) {
        try {
            const fileChange = JSON.parse(match[1]) as FileChange;
            const cleanedResponse = response.replace(fileOpRegex, '').trim();
            return { fileChange, cleanedResponse };
        } catch (error) {
            console.error("Fehler beim Parsen des Dateioperations-JSON:", error);
            return { fileChange: null, cleanedResponse: response };
        }
    }

    return { fileChange: null, cleanedResponse: response };
};


const App: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'initial-message',
            author: MessageAuthor.SYSTEM,
            content: `**Willkommen bei Klicki-Bunti Gemini!**

Ich bin ein KI-Assistent, der Ihnen bei Ihren Programmieraufgaben helfen kann.

**Erste Schritte:**
1.  Klicken Sie auf **"Verzeichnis auswählen"**, um mir Kontext über Ihr Projekt zu geben. Ich werde Lese- und Schreibzugriff anfordern.
2.  Ich werde die Dateistruktur anzeigen. Klicken Sie auf eine Datei, um deren Inhalt zu meinem Kontext hinzuzufügen.
3.  Stellen Sie mir eine Frage zu Ihrem Code! Ich kann Ihnen auch beim Erstellen oder Ändern von Dateien helfen.

*Hinweis: Diese App verwendet die moderne File System Access API Ihres Browsers, um sicher auf lokale Dateien zuzugreifen. Ihre Dateien verlassen Ihren Computer nicht, außer denen, die Sie aktiv als Kontext für eine Anfrage auswählen.*`
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const { fileTree, rootName, openDirectoryPicker, isLoading: isTreeLoading, error: treeError, directoryHandle, refreshFileTree } = useFileTree();
    const [activeFile, setActiveFile] = useState<FileItem | null>(null);
    const [activeFileContent, setActiveFileContent] = useState<string | null>(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            if (rootName) isInitialMount.current = false;
        } else if(rootName) {
            setActiveFile(null);
            setActiveFileContent(null);
            setMessages(prev => [...prev, {
                id: `dir-change-${Date.now()}`,
                author: MessageAuthor.SYSTEM,
                content: `Verzeichnis gewechselt zu **${rootName}**. Der aktive Dateikontext wurde zurückgesetzt. Wählen Sie bei Bedarf eine neue Datei aus.`
            }]);
        }
    }, [rootName]);

    useEffect(() => {
        if (fileTree) {
            const geminiMdFile = findFileInTree(fileTree, 'GEMINI.md');
            if (geminiMdFile) handleFileClick(geminiMdFile);
        }
    }, [fileTree]);

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
            const errorMessage = e instanceof Error ? e.message : String(e);
            setMessages(prev => [...prev, {
                id: `file-error-${Date.now()}`,
                author: MessageAuthor.SYSTEM,
                content: `Fehler beim Lesen der Datei ${file.name}: ${errorMessage}`
            }]);
            setActiveFile(null);
            setActiveFileContent(null);
        }
    }, []);

    const handleSendMessage = useCallback(async (prompt: string) => {
        if (!prompt || isLoading) return;

        setIsLoading(true);
        const userMessage: ChatMessage = { id: `user-${Date.now()}`, author: MessageAuthor.USER, content: prompt };
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

            const { fileChange, cleanedResponse } = parseFileChange(fullResponse);

            setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, content: cleanedResponse, fileChange: fileChange } : msg));

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, content: `Entschuldigung, ein Fehler ist aufgetreten: ${errorMessage}` } : msg));
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, fileTree, activeFile, activeFileContent]);

    const handleAcceptFileChange = useCallback(async (change: FileChange) => {
        if (!directoryHandle) return;
        setIsLoading(true);
        try {
            if (change.type === 'create') {
                const parentPath = change.filePath.substring(0, change.filePath.lastIndexOf('/'));
                const parentHandle = parentPath ? await fileService.getHandleForPath(directoryHandle, parentPath) : directoryHandle;
                if (parentHandle?.kind !== 'directory') throw new Error("Übergeordneter Pfad ist kein Verzeichnis.");

                const fileName = change.filePath.substring(change.filePath.lastIndexOf('/') + 1);
                await fileService.createFile(parentHandle, fileName, change.newContent);

            } else if (change.type === 'update') {
                const fileHandle = await fileService.getHandleForPath(directoryHandle, change.filePath);
                if (fileHandle?.kind !== 'file') throw new Error("Zieldatei nicht gefunden oder ist ein Verzeichnis.");
                await fileService.updateFile(fileHandle, change.newContent);
            }

            await refreshFileTree();
            setMessages(prev => {
                const newMessages = prev.map(m => ({ ...m, fileChange: undefined }));
                return [...newMessages, { id: `sys-${Date.now()}`, author: MessageAuthor.SYSTEM, content: `Datei **${change.filePath}** erfolgreich ${change.type === 'create' ? 'erstellt' : 'geändert'}.` }];
            });

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            setMessages(prev => [...prev, { id: `sys-err-${Date.now()}`, author: MessageAuthor.SYSTEM, content: `Fehler bei Dateioperation: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [directoryHandle, refreshFileTree]);

    const handleRejectFileChange = useCallback(() => {
        setMessages(prev => {
            const newMessages = prev.map(m => ({ ...m, fileChange: undefined }));
            return [...newMessages, { id: `sys-${Date.now()}`, author: MessageAuthor.SYSTEM, content: "Dateiänderung abgelehnt." }];
        });
    }, []);

    const memoizedFileTree = useMemo(() => {
        return fileTree ? <FileTree item={fileTree} onFileClick={handleFileClick} activeFile={activeFile} /> : null;
    }, [fileTree, activeFile, handleFileClick]);

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200">
            <aside className="w-1/4 max-w-sm min-w-[280px] bg-gray-800/50 flex flex-col p-4 border-r border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                     <Icon name="gemini" className="h-8 w-8 text-blue-400" />
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
                    onAcceptFileChange={handleAcceptFileChange}
                    onRejectFileChange={handleRejectFileChange}
                />
            </main>
        </div>
    );
};

export default App;