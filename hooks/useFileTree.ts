
import { useState, useCallback } from 'react';
import { FileSystemItem, DirectoryItem, FileItem } from '../types';

// Hilfsfunktion zum Überprüfen und Anfordern von Berechtigungen
async function verifyPermission(handle: FileSystemHandle, withWrite: boolean): Promise<boolean> {
    const opts: FileSystemHandlePermissionDescriptor = {};
    if (withWrite) {
        opts.mode = 'readwrite';
    }

    // Überprüfen, ob wir bereits die Berechtigung haben.
    if ((await handle.queryPermission(opts)) === 'granted') {
        return true;
    }

    // Berechtigung anfordern.
    if ((await handle.requestPermission(opts)) === 'granted') {
        return true;
    }

    // Benutzer hat die Berechtigung nicht erteilt.
    return false;
}


export const useFileTree = () => {
    const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [fileTree, setFileTree] = useState<DirectoryItem | null>(null);
    const [rootName, setRootName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const processDirectory = async (handle: FileSystemDirectoryHandle, parentPath: string = ''): Promise<DirectoryItem> => {
        const currentPath = parentPath ? `${parentPath}/${handle.name}` : handle.name;
        const children: FileSystemItem[] = [];
        // Typecast für handle auf any, damit .values() akzeptiert wird
        for await (const entry of ((handle as any).values())) {
            if (entry.kind === 'directory') {
                // Ignore node_modules and .git for performance and relevance
                if (entry.name !== 'node_modules' && entry.name !== '.git') {
                    children.push(await processDirectory(entry, currentPath));
                }
            } else if (entry.kind === 'file') {
                const fileItem: FileItem = {
                    kind: 'file',
                    name: entry.name,
                    handle: entry,
                    path: `${currentPath}/${entry.name}`
                };
                children.push(fileItem);
            }
        }
        // Sort directories first, then files, all alphabetically
        children.sort((a, b) => {
            if (a.kind === b.kind) {
                return a.name.localeCompare(b.name);
            }
            return a.kind === 'directory' ? -1 : 1;
        });

        return { kind: 'directory', name: handle.name, handle, children, path: currentPath };
    };

    const openDirectoryPicker = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!('showDirectoryPicker' in window)) {
                throw new Error('Ihr Browser unterstützt die File System Access API nicht. Bitte verwenden Sie einen modernen Browser wie Chrome oder Edge.');
            }

            const showDirectoryPicker = window.showDirectoryPicker as () => Promise<FileSystemDirectoryHandle>;
            const handle = await showDirectoryPicker();

            // Lese- und Schreibzugriff anfordern
            const hasPermission = await verifyPermission(handle, true);
            if (!hasPermission) {
                setError('Schreibzugriff wurde nicht erteilt. Die Funktionalität ist eingeschränkt.');
                // Optional: Nur mit Leserechten fortfahren oder abbrechen.
                // Wir fahren hier fort, zeigen aber den Fehler an.
            }

            setDirectoryHandle(handle);
            setRootName(handle.name);
            const tree = await processDirectory(handle);
            setFileTree(tree);

        } catch (e) {
            const err = e as Error;
            if (err.name !== 'AbortError') {
              setError(`Fehler beim Öffnen des Verzeichnisses: ${err.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshFileTree = useCallback(async () => {
        if (directoryHandle) {
            setIsLoading(true);
            try {
                const tree = await processDirectory(directoryHandle);
                setFileTree(tree);
            } catch (e) {
                const err = e as Error;
                setError(`Fehler beim Aktualisieren des Verzeichnisbaums: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        }
    }, [directoryHandle]);

    return { directoryHandle, fileTree, rootName, isLoading, error, openDirectoryPicker, refreshFileTree };
};
