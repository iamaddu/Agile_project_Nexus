@echo off
echo ========================================
echo Nexus Cognitive - Automated Test Runner
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Backend dependency installation failed
    exit /b 1
)
echo ✅ Backend dependencies installed
echo.

echo [2/4] Running backend tests...
call npm test -- --watchAll=false
if %errorlevel% neq 0 (
    echo ❌ Backend tests failed
    exit /b 1
)
echo ✅ Backend tests passed
echo.

echo [3/4] Installing frontend dependencies...
cd ../frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Frontend dependency installation failed
    exit /b 1
)
echo ✅ Frontend dependencies installed
echo.

echo [4/4] Running frontend tests...
call npm test -- --run
if %errorlevel% neq 0 (
    echo ❌ Frontend tests failed
    exit /b 1
)
echo ✅ Frontend tests passed
echo.

echo ========================================
echo 🎉 ALL TESTS PASSED SUCCESSFULLY!
echo ========================================
echo.
echo Test Summary:
echo - Backend API tests: ✅
echo - Frontend component tests: ✅
echo - Code coverage generated: ✅
echo.
echo Coverage reports available in:
echo - backend/coverage/lcov-report/index.html
echo - frontend/coverage/lcov-report/index.html
echo.
pause