@echo off
setlocal
cd /d "%~dp0"
set PORT=5173

echo.
echo    嚎哭深渊 · 海克斯大乱斗（本地镜像）
echo.
echo   正在启动本地服务 http://127.0.0.1:%PORT%/
echo   关闭本窗口即可停止服务
echo.

rem 1 秒后自动打开浏览器
start "" "http://127.0.0.1:%PORT%/" >nul 2>&1

python serve.py %PORT%
if errorlevel 1 (
  echo.
  echo   [!] 未找到 python，请安装 Python 3 并勾选 "Add to PATH"
  echo       或手动执行:  python serve.py
  pause
)
