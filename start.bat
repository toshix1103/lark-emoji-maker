@echo off
echo Lark Emoji & Icon Maker を起動中...
cd /d "%~dp0"
start http://localhost:8080
npx -y http-server -p 8080 -c-1 --cors -o
