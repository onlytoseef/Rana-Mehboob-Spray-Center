@echo off
REM =====================================================
REM   Mehboob Spray Center - Database Backup Script
REM =====================================================
REM   Double-click this file to create a backup
REM =====================================================

REM --- DATABASE CONFIGURATION ---
SET DB_HOST=localhost
SET DB_PORT=5432
SET DB_NAME=spraycenter
SET DB_USER=postgres
SET PGPASSWORD=postgre

REM --- BACKUP FOLDER ---
SET BACKUP_DIR=%~dp0backups
IF NOT EXIST "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM --- TIMESTAMP ---
FOR /F "tokens=1-3 delims=/ " %%a IN ('date /t') DO SET DATESTAMP=%%c-%%b-%%a
FOR /F "tokens=1-2 delims=: " %%a IN ('time /t') DO SET TIMESTAMP=%%a-%%b
SET FILENAME=spraycenter_backup_%DATESTAMP%_%TIMESTAMP%.sql

REM --- POSTGRESQL PATH (adjust if needed) ---
SET PG_PATH=C:\Program Files\PostgreSQL\17\bin

echo.
echo =====================================================
echo   MEHBOOB SPRAY CENTER - DATABASE BACKUP
echo =====================================================
echo.
echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo Backup File: %FILENAME%
echo.
echo Creating backup...
echo.

REM --- CREATE BACKUP ---
"%PG_PATH%\pg_dump.exe" -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -F p -f "%BACKUP_DIR%\%FILENAME%"

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================================
    echo   BACKUP SUCCESSFUL!
    echo =====================================================
    echo.
    echo Backup saved to:
    echo %BACKUP_DIR%\%FILENAME%
    echo.
) ELSE (
    echo.
    echo =====================================================
    echo   BACKUP FAILED!
    echo =====================================================
    echo.
    echo Please check:
    echo  1. PostgreSQL is running
    echo  2. Database name is correct
    echo  3. Username/password is correct
    echo  4. PostgreSQL path is correct
    echo.
)

REM --- CLEANUP OLD BACKUPS (keep last 10) ---
echo Cleaning old backups (keeping last 10)...
FOR /F "skip=10 delims=" %%F IN ('dir /b /o-d "%BACKUP_DIR%\*.sql" 2^>nul') DO DEL "%BACKUP_DIR%\%%F"

echo.
pause
