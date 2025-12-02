@echo off
echo ======================================
echo  SOURCE DU PAYS - DEMARRAGE BACKEND
echo ======================================
echo.

cd /d "%~dp0"

echo [1/3] Activation environnement virtuel...
call venv\Scripts\activate.bat

echo [2/3] Demarrage du serveur FastAPI...
echo.
echo Backend demarre sur: http://0.0.0.0:8000
echo Documentation API: http://localhost:8000/docs
echo.
echo Pour arreter le serveur: Ctrl+C
echo ======================================
echo.

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
