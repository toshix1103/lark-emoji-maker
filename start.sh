#!/bin/bash
# Lark Emoji Maker - サーバー起動 & ブラウザ表示
cd "$(dirname "$0")"

# 既にポート8080が使われていなければサーバーを起動
if ! curl -s -o /dev/null http://localhost:8080/ 2>/dev/null; then
  npx -y http-server -p 8080 -c-1 --cors -s &
  sleep 1
fi

# ブラウザで開く
open "http://localhost:8080" 2>/dev/null || start "http://localhost:8080" 2>/dev/null || cmd.exe /c start http://localhost:8080
