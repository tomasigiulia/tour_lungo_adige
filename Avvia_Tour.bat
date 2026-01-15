@echo off
chcp 65001 >nul
title Tour Lungo Adige - Server Locale
color 0A

echo ================================================
echo     TOUR LUNGO ADIGE - AVVIO IN CORSO...
echo ================================================
echo.

cd /d "%~dp0"

echo Avvio del server locale...
echo.
echo Il browser si aprirà automaticamente.
echo.
echo IMPORTANTE: NON CHIUDERE QUESTA FINESTRA!
echo Per terminare il tour, chiudere questa finestra.
echo.
echo Server attivo su: http://localhost:8000
echo ================================================
echo.

timeout /t 2 /nobreak >nul

start http://localhost:8000

powershell -NoProfile -ExecutionPolicy Bypass -Command "$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8000/'); $listener.Start(); Write-Host 'Server avviato correttamente!' -ForegroundColor Green; while ($listener.IsListening) { $context = $listener.GetContext(); $request = $context.Request; $response = $context.Response; $path = $request.Url.LocalPath; if ($path -eq '/') { $path = '/index.html' }; $fullPath = Join-Path (Get-Location) $path.TrimStart('/'); if (Test-Path $fullPath) { $ext = [System.IO.Path]::GetExtension($fullPath).ToLower(); $contentType = switch ($ext) { '.html' { 'text/html; charset=utf-8' } '.js' { 'application/javascript; charset=utf-8' } '.css' { 'text/css; charset=utf-8' } '.jpg' { 'image/jpeg' } '.jpeg' { 'image/jpeg' } '.png' { 'image/png' } '.gif' { 'image/gif' } '.svg' { 'image/svg+xml' } '.json' { 'application/json' } default { 'application/octet-stream' } }; $response.ContentType = $contentType; $content = [System.IO.File]::ReadAllBytes($fullPath); $response.ContentLength64 = $content.Length; $response.OutputStream.Write($content, 0, $content.Length) } else { $response.StatusCode = 404; $errorMsg = [System.Text.Encoding]::UTF8.GetBytes('File non trovato'); $response.OutputStream.Write($errorMsg, 0, $errorMsg.Length) }; $response.Close() }"

pause
