#!/usr/bin/env bash
# 嚎哭深渊 · 海克斯大乱斗 · 本地镜像启动脚本
# 启动前检查资源是否就绪，缺失则自动拉取。

set -e
cd "$(dirname "$0")"

PORT="${1:-5173}"
SAMPLE="static/r20260915-miss-fortune-1/assets/Ashe-loading.jpg"

echo
echo "  *** 嚎哭深渊 - 海克斯大乱斗(本地镜像)"
echo

if [ ! -f "$SAMPLE" ]; then
  echo "  [!] 资源文件未就绪，自动从原站拉取（约 178MB / 2-3 分钟）..."
  echo "      如需跳过请按 Ctrl+C 终止。"
  echo
  if [ -f tools/mirror.py ]; then
    python3 tools/mirror.py
  else
    echo "  [错误] 找不到 tools/mirror.py，请确认你在项目根目录里运行此脚本。"
    exit 1
  fi
  echo
fi

echo "  启动服务 http://127.0.0.1:$PORT/  （按 Ctrl+C 停止）"
echo

# 自动打开浏览器（后台）
( sleep 1 && open "http://127.0.0.1:$PORT/" 2>/dev/null || xdg-open "http://127.0.0.1:$PORT/" 2>/dev/null ) &

exec python3 serve.py "$PORT"