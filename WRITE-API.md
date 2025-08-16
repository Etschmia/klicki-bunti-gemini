# WRITE-API Dokumentation

Dieses Dokument beschreibt die API zum Erstellen und Ändern von Dateien innerhalb der Klicki-Bunti-Anwendung.

## Übersicht

Die API ermöglicht es dem KI-Assistenten, nach expliziter Zustimmung des Benutzers, Dateioperationen im ausgewählten Verzeichnis durchzuführen. Dies umfasst das Erstellen neuer Dateien und das Ändern bestehender Dateien.

## Berechtigungen

Beim ersten Auswählen eines Verzeichnisses wird der Benutzer vom Browser um Lese- und Schreibberechtigungen (`readwrite`) für dieses Verzeichnis gebeten. Diese Berechtigungen sind für die Funktionalität der Schreib-API zwingend erforderlich.

## API-Funktionen

Die Kernlogik für Dateioperationen wird in `services/fileService.ts` gekapselt.

### `createFile(directoryHandle: FileSystemDirectoryHandle, fileName: string, content: string): Promise<FileSystemFileHandle>`

- **Zweck:** Erstellt eine neue Datei im angegebenen Verzeichnis.
- **Parameter:**
  - `directoryHandle`: Das Handle des Verzeichnisses, in dem die Datei erstellt werden soll.
  - `fileName`: Der Name der zu erstellenden Datei.
  - `content`: Der initiale Inhalt der Datei.
- **Rückgabewert:** Ein Promise, das zum `FileSystemFileHandle` der neu erstellten Datei aufgelöst wird.
- **Löst aus:** Ein Fehler wird ausgelöst, wenn die Datei bereits existiert oder die Berechtigung fehlt.

### `updateFile(fileHandle: FileSystemFileHandle, content: string): Promise<void>`

- **Zweck:** Schreibt neuen Inhalt in eine bestehende Datei.
- **Parameter:**
  - `fileHandle`: Das Handle der zu ändernden Datei.
  - `content`: Der neue Inhalt, der in die Datei geschrieben werden soll.
- **Rückgabewert:** Ein Promise, das aufgelöst wird, wenn der Schreibvorgang abgeschlossen ist.

### `getHandleForPath(rootHandle: FileSystemDirectoryHandle, path: string): Promise<FileSystemFileHandle | FileSystemDirectoryHandle | null>`

- **Zweck:** Ruft das Handle für einen gegebenen relativen Pfad (z.B. `src/components/MyComponent.tsx`) ab.
- **Parameter:**
  - `rootHandle`: Das Handle des Stammverzeichnisses des Projekts.
  - `path`: Der relative Pfad zur gewünschten Datei oder zum gewünschten Verzeichnis.
- **Rückgabewert:** Ein Promise, das zum entsprechenden `FileSystemFileHandle` oder `FileSystemDirectoryHandle` aufgelöst wird, oder `null`, wenn der Pfad nicht existiert.

## Interaktion mit der KI

Die KI kann Dateiänderungen vorschlagen, indem sie spezielle, formatierte Blöcke in ihren Antworten sendet. Die Anwendung erkennt diese Blöcke, parst sie und fragt den Benutzer, ob die vorgeschlagene Änderung angewendet werden soll.

Die KI muss einen speziellen Markdown-Codeblock verwenden, um eine Dateioperation vorzuschlagen. Die Anwendung sucht nach diesem spezifischen Format.

**Format:**
\`\`\`json:file-op
{
  "type": "create" | "update",
  "filePath": "relativer/pfad/zur/datei.js",
  "newContent": "Der vollständige neue Inhalt der Datei hier."
}
\`\`\`

- **`type`**: Entweder `"create"` zum Erstellen einer neuen Datei oder `"update"` zum Überschreiben einer vorhandenen Datei.
- **`filePath`**: Der relative Pfad von der Wurzel des geöffneten Verzeichnisses.
- **`newContent`**: Der gesamte Inhalt, der in die Datei geschrieben werden soll.

Jeglicher Text außerhalb dieses Blocks wird als normale Konversationsantwort behandelt und dem Benutzer angezeigt.
