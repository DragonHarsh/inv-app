@echo off
echo Starting Local Shop Inventory Management System...
echo.
echo Opening browser in 3 seconds...
echo Default login: admin / 0000
echo.
timeout /t 3 /nobreak >nul
start http://localhost:8000
python -m http.server 8000
pause
