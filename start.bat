@echo off
title Teneo

setlocal

:: Mở terminal tại thư mục hiện tại
cd /d %~dp0


node main.js

:: pause
pause

endlocal
