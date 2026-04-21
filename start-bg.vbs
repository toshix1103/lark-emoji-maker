Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\Users\Owner\Desktop\開発\projects\lark-emoji-maker && npx -y http-server -p 8080 -c-1 --cors -s", 0, False
