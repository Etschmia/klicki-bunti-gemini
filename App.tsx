
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ChatMessage, MessageAuthor, FileItem, FileSystemItem, FileChange } from './types';
import { useFileTree } from './hooks/useFileTree';
import { useChatHistory } from './hooks/useChatHistory';
import { generateResponseStream } from './services/geminiService';
import { preloadGemini } from './services/lazyGeminiService';
import * as fileService from './services/fileService';
import ChatInterface from './components/ChatInterface';
import DirectoryPicker from './components/DirectoryPicker';
import FileTree from './components/FileTree';
import SettingsPanel from './components/SettingsPanel';
import ProjectInfo from './components/ProjectInfo';
import { Icon } from './components/Icon';
import { ThemeProvider } from './contexts/ThemeContext';

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


const AppContent: React.FC = () => {
    const { fileTree, rootName, openDirectoryPicker, isLoading: isTreeLoading, error: treeError, directoryHandle, refreshFileTree } = useFileTree();
    const { messages, addMessage, updateMessage, deleteMessage, toggleMessageFavorite, currentSession, clearCurrentSession } = useChatHistory(rootName || undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [activeFile, setActiveFile] = useState<FileItem | null>(null);
    const [activeFileContent, setActiveFileContent] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const isInitialMount = useRef(true);

    // Add initial welcome message if no messages exist
    useEffect(() => {
        if (messages.length === 0) {
            addMessage(`**Willkommen bei Klicki-Bunti Gemini!**

Ich bin ein KI-Assistent, der Ihnen bei Ihren Programmieraufgaben helfen kann.

**Erste Schritte:**
1.  Klicken Sie auf **"Verzeichnis auswählen"**, um mir Kontext über Ihr Projekt zu geben. Ich werde Lese- und Schreibzugriff anfordern.
2.  Ich werde die Dateistruktur anzeigen. Klicken Sie auf eine Datei, um deren Inhalt zu meinem Kontext hinzuzufügen.
3.  Stellen Sie mir eine Frage zu Ihrem Code! Ich kann Ihnen auch beim Erstellen oder Ändern von Dateien helfen.

*Hinweis: Diese App verwendet die moderne File System Access API Ihres Browsers, um sicher auf lokale Dateien zuzugreifen. Ihre Dateien verlassen Ihren Computer nicht, außer denen, die Sie aktiv als Kontext für eine Anfrage auswählen.*`, MessageAuthor.SYSTEM);
        }
        
        // Preload Gemini module for better performance
        preloadGemini();
    }, [addMessage, messages.length]);

    useEffect(() => {
        if (isInitialMount.current) {
            if (rootName) isInitialMount.current = false;
        } else if(rootName) {
            setActiveFile(null);
            setActiveFileContent(null);
            addMessage(`Verzeichnis gewechselt zu **${rootName}**. Der aktive Dateikontext wurde zurückgesetzt. Wählen Sie bei Bedarf eine neue Datei aus.`, MessageAuthor.SYSTEM);
        }
    }, [rootName, addMessage]);

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
            addMessage(`Kontext aktualisiert. Aktive Datei ist jetzt **${file.name}**. Ich werde den Inhalt dieser Datei bei meiner nächsten Antwort berücksichtigen.`, MessageAuthor.SYSTEM);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            addMessage(`Fehler beim Lesen der Datei ${file.name}: ${errorMessage}`, MessageAuthor.SYSTEM);
            setActiveFile(null);
            setActiveFileContent(null);
        }
    }, []);

    const handleSendMessage = useCallback(async (prompt: string) => {
        if (!prompt || isLoading) return;

        setIsLoading(true);
        const userMessage = addMessage(prompt, MessageAuthor.USER);
        const aiMessage = addMessage('...', MessageAuthor.AI);

        try {
            const stream = await generateResponseStream(prompt, fileTree, activeFile ? { name: activeFile.name, content: activeFileContent ?? '' } : null);

            let fullResponse = '';
            updateMessage(aiMessage.id, '');

            for await (const chunk of stream) {
                fullResponse += chunk;
                updateMessage(aiMessage.id, fullResponse);
            }

            const { fileChange, cleanedResponse } = parseFileChange(fullResponse);
            updateMessage(aiMessage.id, cleanedResponse);
            
            // If there's a file change, update the message with it
            if (fileChange) {
                // We'll need to update this when we add file change support to the updated message system
            }

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            updateMessage(aiMessage.id, `Entschuldigung, ein Fehler ist aufgetreten: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, fileTree, activeFile, activeFileContent, addMessage, updateMessage]);

    const handleAcceptFileChange = useCallback(async (change: FileChange) => {
        if (!directoryHandle || !rootName) return;
        setIsLoading(true);

        // Pfad bereinigen: Entfernt führende/nachfolgende Leerzeichen und das Stammverzeichnis, falls vorhanden.
        let cleanPath = change.filePath.trim();
        const rootPrefix = `${rootName}/`;
        if (cleanPath.startsWith(rootPrefix)) {
            cleanPath = cleanPath.substring(rootPrefix.length);
        }

        try {
            if (change.type === 'create') {
                const parentPath = cleanPath.substring(0, cleanPath.lastIndexOf('/'));
                const parentHandle = parentPath ? await fileService.getHandleForPath(directoryHandle, parentPath) : directoryHandle;
                if (parentHandle?.kind !== 'directory') {
                    throw new Error("Übergeordneter Pfad ist kein Verzeichnis.");
                }

                const fileName = cleanPath.substring(cleanPath.lastIndexOf('/') + 1);
                await fileService.createFile(parentHandle, fileName, change.newContent);

            } else if (change.type === 'update') {
                const fileHandle = await fileService.getHandleForPath(directoryHandle, cleanPath);
                if (fileHandle?.kind !== 'file') {
                    throw new Error("Zieldatei nicht gefunden oder ist ein Verzeichnis.");
                }
                await fileService.updateFile(fileHandle, change.newContent);
            }

            await refreshFileTree();
            addMessage(`Datei **${change.filePath}** erfolgreich ${change.type === 'create' ? 'erstellt' : 'geändert'}.`, MessageAuthor.SYSTEM);

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            addMessage(`Fehler bei Dateioperation: ${errorMessage}`, MessageAuthor.SYSTEM);
        } finally {
            setIsLoading(false);
        }
    }, [directoryHandle, rootName, refreshFileTree, addMessage]);

    const handleRejectFileChange = useCallback(() => {
        addMessage("Dateiänderung abgelehnt.", MessageAuthor.SYSTEM);
    }, [addMessage]);

    const memoizedFileTree = useMemo(() => {
        return fileTree ? <FileTree item={fileTree} onFileClick={handleFileClick} activeFile={activeFile} /> : null;
    }, [fileTree, activeFile, handleFileClick]);

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200">
            <aside className="w-1/4 max-w-sm min-w-[280px] bg-gray-800/50 flex flex-col p-4 border-r border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Icon name="gemini" className="h-8 w-8 text-blue-400" />
                        <h1 className="text-xl font-bold">Klicki-Bunti Gemini</h1>
                    </div>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                        title="Settings"
                    >
                        <Icon name="settings" className="w-5 h-5" />
                    </button>
                </div>
                <DirectoryPicker onOpen={openDirectoryPicker} directoryName={rootName} isLoading={isTreeLoading} />
                {treeError && <p className="text-red-400 text-sm mt-2">{treeError}</p>}
                <div className="mt-4 flex-1 overflow-y-auto pr-2">
                    {isTreeLoading ? <p>Lade Verzeichnis...</p> : memoizedFileTree}
                    <ProjectInfo fileTree={fileTree} rootName={rootName} />
                </div>
            </aside>
            <main className="flex-1 flex flex-col h-screen">
                <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    onAcceptFileChange={handleAcceptFileChange}
                    onRejectFileChange={handleRejectFileChange}
                    onEditMessage={updateMessage}
                    onDeleteMessage={deleteMessage}
                    onToggleFavorite={toggleMessageFavorite}
                    sessionName={currentSession?.name}
                    onClearChat={clearCurrentSession}
                />
            </main>
            
            {/* Settings Panel */}
            <SettingsPanel 
                isOpen={showSettings} 
                onClose={() => setShowSettings(false)} 
            />
        </div>
    );
};

// Main App component with ThemeProvider
const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
};

export default App;