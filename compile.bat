@echo off
echo Compiling CinePlex with Debug Logging...
if not exist bin mkdir bin
if exist sources.txt del /q sources.txt
for /r src %%f in (*.java) do @echo %%f>>sources.txt
javac -encoding UTF-8 -cp "lib\*" -d bin "@sources.txt"
if %errorlevel% neq 0 (
    echo Compilation failed!
    exit /b %errorlevel%
)
echo Compilation successful.
