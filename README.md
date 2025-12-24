# Remote Claude Chat

Remote web interface for chatting with Claude Code from anywhere.

## Features

- 💬 Chat interface for Claude Code
- 📱 Mobile-friendly design
- 🌐 Works over ngrok tunnel
- ⚡ Real-time responses
- 🔒 Runs locally, access remotely

## Quick Start

```bash
# Clone the repo
git clone https://github.com/0xChampi/remote-claude.git
cd remote-claude

# Start the server (uses current directory as working dir)
./start.sh

# Or specify a working directory
./start.sh /path/to/your/project
```

Then open http://localhost:3000

## Remote Access Setup

In a separate terminal:

```bash
ngrok http 3000
```

Access from anywhere using the ngrok URL (e.g., https://xxxxx.ngrok-free.app)

## Manual Setup

1. Make sure Claude Code is installed:
```bash
claude --version
```

2. Start the server:
```bash
node remote-claude-proper.js
```

3. Set up ngrok tunnel (optional, for remote access):
```bash
ngrok http 3000
```

## Configuration

Edit `remote-claude-proper.js` to change:
- `PORT`: Server port (default: 3000)
- `WORKING_DIR`: Directory where Claude commands run

## Files

- `remote-claude-proper.js` - Main chat server with Claude Code integration
- `remote-bash-chat.js` - Alternative bash shell interface
- `remote-claude-chat.js` - Earlier version with different approach
- `start.sh` - Quick start script

## Usage Examples

Ask Claude anything about your code:
- "list all files in this project"
- "explain the package.json"
- "what does this code do?"
- "create a new feature for user authentication"
- "refactor this function to be more efficient"

## Security Note

⚠️ This runs Claude Code with full access to your filesystem at `WORKING_DIR`. 

**Security recommendations:**
- Only use over trusted networks
- Enable ngrok authentication for remote access
- Don't expose sensitive directories
- Review all code suggestions before applying

## Requirements

- Node.js v14+
- Claude Code CLI installed ([Get it here](https://claude.com/claude-code))
- ngrok (optional, for remote access)

## Repository

https://github.com/0xChampi/remote-claude

## License

MIT
