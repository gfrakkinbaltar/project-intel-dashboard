#!/bin/bash
# AI Development Mission Control - Startup Script

echo "🚀 Starting AI Development Mission Control..."
echo ""

# Check for venv
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Install Python dependencies
echo "Installing Python dependencies..."
venv/bin/pip install -q flask flask-cors psutil requests

# Check if frontend is built
if [ ! -d "dist" ]; then
    echo "Building frontend..."
    npm install
    npm run build
fi

# Start backend
echo ""
echo "✅ Backend starting on http://localhost:5000"
echo "✅ Dashboard at http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

venv/bin/python app.py
