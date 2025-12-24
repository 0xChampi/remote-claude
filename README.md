# Remote Claude Chat

Remote web interface for chatting with Claude Code from anywhere.

## Features

- 💬 Chat interface for Claude Code
- 📱 Mobile-friendly design
- 🌐 Works over ngrok tunnel
- ⚡ Real-time responses

## Setup

1. Install dependencies:
```bash
npm install
# No dependencies needed - uses built-in Node.js modules
```

2. Make sure Claude Code is installed:
```bash
claude --version
```

3. Start the server:
```bash
node remote-claude-proper.js
```

4. Set up ngrok tunnel (for remote access):
```bash
ngrok http 3000
```

5. Access the interface:
- Local: http://localhost:3000
- Remote: Use the ngrok URL (e.g., https://xxxxx.ngrok-free.app)

## Configuration

Edit `remote-claude-proper.js` to change:
- `PORT`: Server port (default: 3000)
- `WORKING_DIR`: Directory where Claude commands run

## Files

- `remote-claude-proper.js` - Main chat server with Claude Code integration
- `remote-bash-chat.js` - Alternative bash shell interface
- `remote-claude-chat.js` - Earlier version with different approach

## Usage

Ask Claude anything:
- "list all files in this project"
- "explain the package.json"
- "what does this code do?"
- "create a new feature for X"

## Security Note

⚠️ This runs Claude Code with full access to your filesystem at `WORKING_DIR`. Only use over trusted networks or with ngrok authentication enabled.

## Requirements

- Node.js v14+
- Claude Code CLI installed
- ngrok (optional, for remote access)
