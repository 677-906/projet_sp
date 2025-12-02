@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.6.7-hotspot
cd /d "%~dp0android"
call gradlew.bat clean
call gradlew.bat assembleRelease
echo Build completed!
pause
