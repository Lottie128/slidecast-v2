#!/bin/bash

echo "🔍 Debugging SlideCast V2..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file missing! Creating from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your credentials"
    exit 1
fi

# Check if backend is running
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is NOT running on port 3001"
    echo "   Start with: bun run dev:server"
fi

# Check if frontend is running
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is NOT running on port 5173"
    echo "   Start with: bun run dev:client"
fi

echo ""
echo "🌐 Open: http://localhost:5173"
echo "📊 Check browser console (F12) for errors"
echo ""
echo "📋 Quick Checklist:"
echo "  1. Backend on port 3001? (curl http://localhost:3001/api/health)"
echo "  2. Frontend on port 5173? (curl http://localhost:5173)"
echo "  3. Browser console errors? (F12 → Console tab)"
echo "  4. Network errors? (F12 → Network tab)"
