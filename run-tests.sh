#!/bin/bash

echo "========================================"
echo "Nexus Cognitive - Automated Test Runner"
echo "========================================"
echo

cd "$(dirname "$0")"

echo "[1/4] Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend dependency installation failed"
    exit 1
fi
echo "✅ Backend dependencies installed"
echo

echo "[2/4] Running backend tests..."
npm test -- --watchAll=false
if [ $? -ne 0 ]; then
    echo "❌ Backend tests failed"
    exit 1
fi
echo "✅ Backend tests passed"
echo

echo "[3/4] Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend dependency installation failed"
    exit 1
fi
echo "✅ Frontend dependencies installed"
echo

echo "[4/4] Running frontend tests..."
npm test -- --run
if [ $? -ne 0 ]; then
    echo "❌ Frontend tests failed"
    exit 1
fi
echo "✅ Frontend tests passed"
echo

echo "========================================"
echo "🎉 ALL TESTS PASSED SUCCESSFULLY!"
echo "========================================"
echo
echo "Test Summary:"
echo "- Backend API tests: ✅"
echo "- Frontend component tests: ✅"
echo "- Code coverage generated: ✅"
echo
echo "Coverage reports available in:"
echo "- backend/coverage/lcov-report/index.html"
echo "- frontend/coverage/lcov-report/index.html"
echo