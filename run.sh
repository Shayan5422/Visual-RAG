#!/bin/bash

# Get the absolute path of the current directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/app/backend"
FRONTEND_DIR="$ROOT_DIR/app/frontend"

echo "Starting from directory: $ROOT_DIR"

# Check if Ollama is running
ollama_running=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:11434/api/version || echo "404")

if [ "$ollama_running" != "200" ]; then
    echo "❌ Ollama is not running. Please start it with 'ollama serve' in a separate terminal."
    exit 1
fi

# Check if Moondream model is available
moondream_available=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:11434/api/tags | grep -q "moondream"; echo $?)

if [ "$moondream_available" != "0" ]; then
    echo "⚠️ Moondream model may not be available. Please run 'ollama pull moondream' first."
    read -p "Do you want to pull the Moondream model now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Pulling Moondream model..."
        ollama pull moondream
    fi
fi

# Create necessary directories
mkdir -p "$BACKEND_DIR/uploads" "$BACKEND_DIR/db"

# Start backend server
echo "🚀 Starting backend server from $BACKEND_DIR..."
cd "$BACKEND_DIR"
python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

cd "$ROOT_DIR"

# Install frontend dependencies if needed
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install
    cd "$ROOT_DIR"
fi

# Start frontend server
echo "🚀 Starting frontend server from $FRONTEND_DIR..."
cd "$FRONTEND_DIR"
npm start &
FRONTEND_PID=$!

# Function to handle script termination
function cleanup {
    echo "Shutting down servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

# Register the cleanup function for termination signals
trap cleanup EXIT INT TERM

# Wait for processes to finish
wait 