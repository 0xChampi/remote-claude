const http = require('http');
const { exec } = require('child_process');
const url = require('url');

const PORT = 3000;

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
        .header h1 {
            font-size: 20px;
            font-weight: 600;
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
        .message.user {
            align-self: flex-end;
        }
        .message.assistant {
            align-self: flex-start;
        }
        .message-bubble {
            padding: 12px 16px;
            border-radius: 18px;
            word-wrap: break-word;
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
        .message.user .message-time {
            text-align: right;
        }
        .code-block {
            background: #0d0d16;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 12px;
            margin: 8px 0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            white-space: pre-wrap;
            overflow-x: auto;
        }
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
    </style>
</head>
<body>
    <div class="header">
        <h1>💬 Chat with Claude</h1>
    </div>

    <div class="chat-container" id="chatContainer">
        <div class="message assistant">
            <div class="message-bubble">
                Hey! I'm Claude, ready to help you code. What would you like to work on?
            </div>
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

        function addMessage(text, type) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + type;

            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'message-bubble';

            // Check if output contains code
            if (type === 'assistant' && text.includes('\\n') && text.length > 100) {
                bubbleDiv.innerHTML = '<div class="code-block">' + escapeHtml(text) + '</div>';
            } else {
                bubbleDiv.textContent = text;
            }

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

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
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
                const response = await fetch('/execute', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({prompt: message})
                });

                const data = await response.json();
                hideTyping();

                const output = data.output || data.error || 'Done';
                addMessage(output, 'assistant');
            } catch (error) {
                hideTyping();
                addMessage('Error: ' + error.message, 'assistant');
            } finally {
                sendBtn.disabled = false;
                messageInput.focus();
            }
        }

        // Auto-resize textarea
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

    if (parsedUrl.pathname === '/' && req.method === 'GET') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(HTML);
    } else if (parsedUrl.pathname === '/execute' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { prompt } = JSON.parse(body);
                const cmd = 'claude --print "' + prompt.replace(/"/g, '\\"') + '"';
                exec(cmd, {
                    cwd: '/Users/innuendo/dev/testingattnstable/attn-clean',
                    timeout: 60000,
                    maxBuffer: 1024 * 1024 * 10
                }, (error, stdout, stderr) => {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({
                        success: !error,
                        output: stdout || stderr,
                        error: error ? error.message : null
                    }));
                });
            } catch (e) {
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: e.message}));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log('💬 Chat with Claude server running on port ' + PORT);
    console.log('📱 Access at: http://localhost:' + PORT);
});
