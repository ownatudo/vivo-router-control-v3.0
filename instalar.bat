@echo off
title Instalar Roteador Control v3.0
echo [INFO] Instalando modulos do Node.js...
call npm install
echo [INFO] Tudo pronto! Abrindo o sistema...
timeout /t 2
npm start
pause
