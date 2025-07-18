@echo off
setlocal

REM Gehe in das Projektverzeichnis
REM %~dp0 steht für das Verzeichnis, in dem die Batch-Datei liegt.
cd /d "%~dp0"

echo Starte Klicki-Bunti-Gemini Entwicklungsserver...

REM Temporäre Log-Datei für die Server-Ausgabe. %RANDOM% verhindert Konflikte.
set "LOGFILE=%TEMP%\vite-dev-server-%RANDOM%.log"

REM Starte den Entwicklungsserver im Hintergrund und leite die Ausgabe in die Log-Datei um.
REM Das /B Flag sorgt dafür, dass es im selben Fenster im Hintergrund läuft.
start "ViteDevServer" /b cmd /c "npm run dev >""%LOGFILE%"" 2>&1"

echo Warte auf den Start des Servers...

:waitForServer
REM Warte eine Sekunde, bevor die Log-Datei erneut geprüft wird.
timeout /t 1 >nul

REM Prüfe, ob die Log-Datei die Zeile mit "Local:" enthält.
findstr /C:"Local:" "%LOGFILE%" >nul
if errorlevel 1 goto waitForServer

echo Server gestartet. Extrahiere URL...

REM Extrahiere die URL aus der Log-Datei (das 3. "Wort" in der Zeile mit "Local:").
for /f "tokens=3" %%i in ('findstr /C:"Local:" "%LOGFILE%"') do (
    set "VITE_URL=%%i"
)

del "%LOGFILE%" >nul 2>&1

if defined VITE_URL (
    echo Öffne Browser mit der URL: %VITE_URL%
    start "" "%VITE_URL%"
) else (
    echo FEHLER: Die URL konnte nicht extrahiert werden. Bitte 'npm run dev' manuell starten.
)

echo.
echo Der Entwicklungsserver läuft. Dieses Konsolenfenster muss geöffnet bleiben.
echo Zum Beenden der Anwendung: Schließen Sie dieses Konsolenfenster (oder druecken Sie Strg+C).
pause >nul
endlocal