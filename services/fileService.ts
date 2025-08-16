/**
 * Holt das Handle für einen bestimmten Pfad, beginnend bei einem Wurzelverzeichnis-Handle.
 * @param rootHandle Das Handle des Stammverzeichnisses.
 * @param path Der relative Pfad zur Datei oder zum Verzeichnis.
 * @returns Ein Promise, das zum Handle oder null aufgelöst wird, wenn es nicht gefunden wird.
 */
export async function getHandleForPath(
  rootHandle: FileSystemDirectoryHandle,
  path: string
): Promise<FileSystemFileHandle | FileSystemDirectoryHandle | null> {
  const parts = path.split('/').filter(p => p);
  let currentHandle: FileSystemDirectoryHandle = rootHandle;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLastPart = i === parts.length - 1;

    try {
      if (isLastPart) {
        // Versuchen, sowohl Datei als auch Verzeichnis zu finden
        try {
          const fileHandle = await currentHandle.getFileHandle(part);
          return fileHandle;
        } catch (e) {
          const dirHandle = await currentHandle.getDirectoryHandle(part);
          return dirHandle;
        }
      } else {
        currentHandle = await currentHandle.getDirectoryHandle(part);
      }
    } catch (e) {
      // Wenn ein Teil des Pfades nicht gefunden wird
      console.error(`Konnte Handle für Pfadsegment nicht finden: ${part}`, e);
      return null;
    }
  }

  return currentHandle; // Sollte der Root sein, wenn der Pfad leer ist
}


/**
 * Erstellt eine neue Datei in einem bestimmten Verzeichnis.
 * @param directoryHandle Das Handle des Verzeichnisses.
 * @param fileName Der Name der zu erstellenden Datei.
 * @param content Der initiale Inhalt der Datei.
 * @returns Ein Promise, das zum Handle der neuen Datei aufgelöst wird.
 */
export async function createFile(
  directoryHandle: FileSystemDirectoryHandle,
  fileName: string,
  content: string
): Promise<FileSystemFileHandle> {
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
  return fileHandle;
}

/**
 * Aktualisiert den Inhalt einer bestehenden Datei.
 * @param fileHandle Das Handle der zu aktualisierenden Datei.
 * @param content Der neue Inhalt.
 * @returns Ein Promise, das aufgelöst wird, wenn die Datei geschrieben wurde.
 */
export async function updateFile(
  fileHandle: FileSystemFileHandle,
  content: string
): Promise<void> {
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}
