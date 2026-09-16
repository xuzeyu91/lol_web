@echo off
setlocal
cd /d %~dp0
python serve.py 5173
pause