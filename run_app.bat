@echo off
echo Launching CinePlex Application...
java -cp "bin;lib\*" Main
if %errorlevel% neq 0 (
    echo.
    echo Application failed to start! 
    echo Make sure you have run 'setup_db.bat' first to initialize the database.
    echo Also ensure the 'bin' folder exists and is compiled.
    pause
)
