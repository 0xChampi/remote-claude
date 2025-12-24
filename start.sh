#!/bin/bash

# Start Remote Claude Chat
# Usage: ./start.sh [working-directory]

WORKING_DIR=${1:-$(pwd)}

echo "🤖 Starting Remote Claude Chat..."
echo "📁 Working directory: $WORKING_DIR"
echo ""

# Check if Claude is installed
if ! command -v claude &> /dev/null; then
    echo "❌ Error: Claude Code is not installed"
    echo "Install from: https://claude.com/claude-code"
    exit 1
fi

echo "✅ Claude Code found: $(claude --version)"
echo ""

# Update working directory in the script
sed -i.bak "s|const WORKING_DIR = '.*';|const WORKING_DIR = '$WORKING_DIR';|" remote-claude-proper.js

echo "Starting server on port 3000..."
node remote-claude-proper.js &
SERVER_PID=$!

echo "Server PID: $SERVER_PID"
echo ""
echo "✅ Server running at http://localhost:3000"
echo ""
echo "🌐 To access remotely, run in another terminal:"
echo "   ngrok http 3000"
echo ""
echo "Press Ctrl+C to stop"

wait $SERVER_PID
