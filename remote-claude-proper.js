const http = require('http');
const { spawn } = require('child_process');
const url = require('url');

const PORT = 3000;
const WORKING_DIR = '/Users/innuendo/dev/testingattnstable/attn-clean';

const HTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat with Claude</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, system-ui, sans-serif;
            background: #0f0f1e;
            color: white;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 16px 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .header h1 { font-size: 20px; font-weight: 600; }
        .pwd {
            font-size: 12px;
            opacity: 0.8;
            margin-top: 4px;
            font-family: monospace;
        }
        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .message {
            display: flex;
            flex-direction: column;
            max-width: 85%;
            animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .message.user { align-self: flex-end; }
        .message.assistant { align-self: flex-start; }
        .message-bubble {
            padding: 12px 16px;
            border-radius: 18px;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        .message.user .message-bubble {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .message.assistant .message-bubble {
            background: #1e1e2e;
            color: #e0e0e0;
            border: 1px solid #333;
        }
        .message-time {
            font-size: 11px;
            color: #888;
            margin-top: 4px;
            padding: 0 8px;
        }
        .message.user .message-time { text-align: right; }
        .input-container {
            padding: 16px 20px;
            background: #1a1a2e;
            border-top: 1px solid #333;
            display: flex;
            gap: 12px;
        }
        .input-wrapper {
            flex: 1;
            position: relative;
        }
        textarea {
            width: 100%;
            background: #0f0f1e;
            border: 2px solid #333;
            border-radius: 24px;
            padding: 12px 50px 12px 16px;
            color: white;
            font-size: 16px;
            font-family: inherit;
            resize: none;
            max-height: 120px;
        }
        textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .typing-indicator {
            display: flex;
            gap: 4px;
            padding: 12px 16px;
        }
        .typing-indicator span {
            width: 8px;
            height: 8px;
            background: #667eea;
            border-radius: 50%;
            animation: bounce 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
        }
        .error { color: #ff6b6b; }
    </style>
</head>
<body>
    <div class="header">
        <h1>💬 Claude Code</h1>
        <div class="pwd">${WORKING_DIR}</div>
    </div>

    <div class="chat-container" id="chatContainer">
        <div class="message assistant">
            <div class="message-bubble">Hey! I'm Claude. Ask me anything about your code or tell me what you'd like to build.</div>
            <div class="message-time">Just now</div>
        </div>
    </div>

    <div class="input-container">
        <div class="input-wrapper">
            <textarea
                id="messageInput"
                placeholder="Type your message..."
                rows="1"
                onkeydown="handleKeyPress(event)"
            ></textarea>
            <button onclick="sendMessage()" id="sendBtn">→</button>
        </div>
    </div>

    <script>
        const chatContainer = document.getElementById('chatContainer');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');

        function handleKeyPress(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        }

        function getTime() {
            const now = new Date();
            return now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }

        function addMessage(text, type, isError = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + type;

            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'message-bubble' + (isError ? ' error' : '');
            bubbleDiv.textContent = text;

            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.textContent = getTime();

            messageDiv.appendChild(bubbleDiv);
            messageDiv.appendChild(timeDiv);
            chatContainer.appendChild(messageDiv);

            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function showTyping() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message assistant';
            typingDiv.id = 'typing';
            typingDiv.innerHTML = '<div class="message-bubble typing-indicator"><span></span><span></span><span></span></div>';
            chatContainer.appendChild(typingDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function hideTyping() {
            const typing = document.getElementById('typing');
            if (typing) typing.remove();
        }

        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;

            addMessage(message, 'user');
            messageInput.value = '';
            messageInput.style.height = 'auto';

            sendBtn.disabled = true;
            showTyping();

            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({message})
                });

                const data = await response.json();
                hideTyping();

                if (data.success) {
                    addMessage(data.response || 'Done!', 'assistant');
                } else {
                    addMessage(data.error || 'Something went wrong', 'assistant', true);
                }
            } catch (error) {
                hideTyping();
                addMessage('Connection error: ' + error.message, 'assistant', true);
            } finally {
                sendBtn.disabled = false;
                messageInput.focus();
            }
        }

        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        messageInput.focus();
    </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (parsedUrl.pathname === '/' && req.method === 'GET') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(HTML);
    } else if (parsedUrl.pathname === '/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { message } = JSON.parse(body);
                if (!message) {
                    res.writeHead(400, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({success: false, error: 'No message provided'}));
                    return;
                }

                console.log('Prompt:', message);

                const claude = spawn('claude', ['--print', message], {
                    cwd: WORKING_DIR,
                    env: {
                        ...process.env,
                        PATH: process.env.PATH + ':/opt/homebrew/bin:/usr/local/bin'
                    }
                });

                let output = '';
                let errorOutput = '';
                let responseSent = false;

                claude.stdout.on('data', (data) => {
                    output += data.toString();
                });

                claude.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                claude.on('close', (code) => {
                    if (responseSent) return;
                    responseSent = true;

                    console.log('Claude exited with code:', code);
                    console.log('Output:', output.substring(0, 200));
                    console.log('Error:', errorOutput.substring(0, 200));

                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({
                        success: code === 0,
                        response: output.trim() || errorOutput.trim(),
                        error: code !== 0 ? `Exit code ${code}` : null
                    }));
                });

                // Timeout after 90 seconds
                const timeout = setTimeout(() => {
                    if (responseSent) return;
                    responseSent = true;

                    claude.kill();
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Request timed out'
                    }));
                }, 90000);

            } catch (e) {
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({success: false, error: e.message}));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log('💬 Claude Code Chat server running on port ' + PORT);
    console.log('📁 Working directory: ' + WORKING_DIR);
    console.log('📱 Access at: http://localhost:' + PORT);
});
