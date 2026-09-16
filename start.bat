@echo off
rem === 强制 UTF-8，避免 CMD 默认 GBK 把中文输出变成乱码 ===
chcp 65001 >nul 2>&1
set PYTHONIOENCODING=utf-8

setlocal
cd /d "%~dp0"
set PORT=5173

echo.
echo   *** 嚎哭深渊 - 海克斯大乱斗(本地镜像)
echo.

rem === 检查资源是否就绪（GitHub clone 时 .gitignore 排除了 178MB 资源）===
set SAMPLE=static\r20260915-miss-fortune-1\assets\Ashe-loading.jpg
if not exist "%SAMPLE%" (
  echo   [!] 资源文件未就绪，自动从原站拉取（约 120MB / 1-2 分钟）...
  echo       如需跳过请按 Ctrl+C 终止。
  echo.
  if exist "tools\decode.py"  python tools\decode.py  2>nul
  if exist "tools\mirror.py" (
    python tools\mirror.py
  ) else (
    echo   [错误] 找不到 tools\mirror.py，请确认你在项目根目录里运行此脚本。
    pause
    exit /b 1
  )
  if errorlevel 1 (
    echo.
    echo   [错误] 资源拉取失败。请检查网络后手动重试:
    echo          python tools\mirror.py
    echo          python tools\extra.py
    pause
    exit /b 1
  )
  echo.
)

echo   启动服务 http://127.0.0.1:%PORT%/  （关闭此窗口即可停止）
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