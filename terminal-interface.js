// Echo Terminal Interface - Human Contact System

class TerminalInterface {
    constructor(mainEditor) {
        this.mainEditor = mainEditor;
        this.isOpen = false;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentPath = '/echo-html-editor';
        
        this.commands = {
            help: this.helpCommand.bind(this),
            contact: this.contactCommand.bind(this),
            support: this.supportCommand.bind(this),
            about: this.aboutCommand.bind(this),
            clear: this.clearCommand.bind(this),
            echo: this.echoCommand.bind(this),
            ls: this.lsCommand.bind(this),
            cat: this.catCommand.bind(this),
            pwd: this.pwdCommand.bind(this),
            whoami: this.whoamiCommand.bind(this),
            date: this.dateCommand.bind(this),
            version: this.versionCommand.bind(this),
            features: this.featuresCommand.bind(this),
            feedback: this.feedbackCommand.bind(this),
            report: this.reportCommand.bind(this),
            docs: this.docsCommand.bind(this),
            exit: this.exitCommand.bind(this)
        };
        
        this.init();
    }

    init() {
        this.createTerminal();
        this.setupKeyboardShortcuts();
        
        // Make terminal globally accessible
        window.terminalInterface = this;
    }

    createTerminal() {
        const terminal = document.createElement('div');
        terminal.className = 'terminal-overlay';
        terminal.id = 'terminal-overlay';
        terminal.innerHTML = `
            <div class="terminal-container">
                <div class="terminal-header">
                    <div class="terminal-title">
                        <i class="fas fa-terminal"></i>
                        Echo Terminal - Human Contact System
                    </div>
                    <div class="terminal-controls">
                        <button class="terminal-control minimize" title="Minimize">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="terminal-control maximize" title="Maximize">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="terminal-control close" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="terminal-body">
                    <div class="terminal-output" id="terminal-output">
                        <div class="terminal-line">
                            <span class="terminal-prompt">echo@html-editor:~$</span>
                            <span class="terminal-text">Welcome to Echo HTML Editor Terminal</span>
                        </div>
                        <div class="terminal-line">
                            <span class="terminal-text">Type 'help' for available commands or 'contact' to reach human support</span>
                        </div>
                        <div class="terminal-line">
                            <span class="terminal-text">Press Ctrl+\` to toggle this terminal</span>
                        </div>
                        <div class="terminal-line terminal-separator"></div>
                    </div>
                    <div class="terminal-input-line">
                        <span class="terminal-prompt">echo@html-editor:${this.currentPath}$</span>
                        <input type="text" class="terminal-input" id="terminal-input" autocomplete="off" spellcheck="false">
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(terminal);
        this.setupTerminalEvents();
    }

    setupTerminalEvents() {
        const input = document.getElementById('terminal-input');
        const closeBtn = document.querySelector('.terminal-control.close');
        const minimizeBtn = document.querySelector('.terminal-control.minimize');
        const maximizeBtn = document.querySelector('.terminal-control.maximize');
        
        // Input handling
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand(input.value.trim());
                input.value = '';
                this.historyIndex = -1;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.autoComplete(input.value);
            }
        });
        
        // Control buttons
        closeBtn.addEventListener('click', () => this.hide());
        minimizeBtn.addEventListener('click', () => this.minimize());
        maximizeBtn.addEventListener('click', () => this.maximize());
        
        // Click to focus input
        document.querySelector('.terminal-container').addEventListener('click', () => {
            input.focus();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+` or Ctrl+~ to toggle terminal
            if (e.ctrlKey && (e.key === '`' || e.key === '~')) {
                e.preventDefault();
                this.toggle();
            }
            // Escape to close terminal
            else if (e.key === 'Escape' && this.isOpen) {
                this.hide();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        const terminal = document.getElementById('terminal-overlay');
        terminal.classList.add('open');
        this.isOpen = true;
        
        // Focus input
        setTimeout(() => {
            document.getElementById('terminal-input').focus();
        }, 100);
        
        // Add welcome message if first time
        if (!localStorage.getItem('echo-terminal-visited')) {
            this.addOutput('', 'Welcome! This terminal provides direct access to human support.');
            this.addOutput('', 'Try commands like: help, contact, support, feedback');
            localStorage.setItem('echo-terminal-visited', 'true');
        }
    }

    hide() {
        const terminal = document.getElementById('terminal-overlay');
        terminal.classList.remove('open');
        this.isOpen = false;
    }

    minimize() {
        const terminal = document.getElementById('terminal-overlay');
        terminal.classList.toggle('minimized');
    }

    maximize() {
        const terminal = document.getElementById('terminal-overlay');
        terminal.classList.toggle('maximized');
    }

    executeCommand(commandLine) {
        if (!commandLine) return;
        
        // Add to history
        this.commandHistory.unshift(commandLine);
        if (this.commandHistory.length > 50) {
            this.commandHistory.pop();
        }
        
        // Show command
        this.addOutput(commandLine, '', 'command');
        
        // Parse command and args
        const [command, ...args] = commandLine.split(' ');
        
        if (this.commands[command]) {
            this.commands[command](args);
        } else {
            this.addOutput('', `Command not found: ${command}. Type 'help' for available commands.`, 'error');
        }
        
        this.scrollToBottom();
    }

    addOutput(command, output, type = 'normal') {
        const outputElement = document.getElementById('terminal-output');
        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        if (type === 'command') {
            line.innerHTML = `
                <span class="terminal-prompt">echo@html-editor:${this.currentPath}$</span>
                <span class="terminal-command">${command}</span>
            `;
        } else {
            line.innerHTML = `<span class="terminal-text ${type}">${output}</span>`;
        }
        
        outputElement.appendChild(line);
    }

    scrollToBottom() {
        const output = document.getElementById('terminal-output');
        output.scrollTop = output.scrollHeight;
    }

    navigateHistory(direction) {
        const input = document.getElementById('terminal-input');
        
        if (direction === -1 && this.historyIndex < this.commandHistory.length - 1) {
            this.historyIndex++;
        } else if (direction === 1 && this.historyIndex > -1) {
            this.historyIndex--;
        }
        
        if (this.historyIndex === -1) {
            input.value = '';
        } else {
            input.value = this.commandHistory[this.historyIndex];
        }
    }

    autoComplete(partial) {
        const matches = Object.keys(this.commands).filter(cmd => 
            cmd.startsWith(partial)
        );
        
        if (matches.length === 1) {
            document.getElementById('terminal-input').value = matches[0];
        } else if (matches.length > 1) {
            this.addOutput('', `Available: ${matches.join(', ')}`);
        }
    }

    // Command implementations
    helpCommand(args) {
        const helpText = `
Available Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 SYSTEM COMMANDS:
  help          Show this help message
  clear         Clear terminal screen
  pwd           Show current directory
  ls            List available resources
  cat [file]    Display file contents
  date          Show current date and time
  whoami        Show current user info
  version       Show Echo editor version
  exit          Close terminal

📞 HUMAN CONTACT:
  contact       Connect with human support
  support       Get technical support
  feedback      Send feedback to developers
  report        Report bugs or issues

📚 INFORMATION:
  about         About Echo HTML Editor
  features      List all available features
  docs          Open documentation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Tips:
  • Use Tab for auto-completion
  • Use ↑/↓ arrows for command history
  • Press Ctrl+\` to toggle this terminal
  • Press Escape to close terminal
        `;
        
        this.addOutput('', helpText.trim());
    }

    contactCommand(args) {
        this.addOutput('', '🤖 Initiating human contact protocol...', 'success');
        this.addOutput('', '');
        
        const contactInfo = `
┌─────────────────────────────────────────────────────────────┐
│                    HUMAN CONTACT SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👋 Hello! You've reached the Echo HTML Editor support.    │
│                                                             │
│  🔗 GitHub Issues: https://github.com/417ps/echo-html-editor/issues
│  📧 Email: support@echo-editor.com                         │
│  💬 Discord: https://discord.gg/echo-editor                │
│                                                             │
│  📝 For fastest response, please include:                  │
│    • Your browser and version                              │
│    • Steps to reproduce any issues                         │
│    • Screenshots if applicable                             │
│                                                             │
│  ⚡ Response time: Usually within 24 hours                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
        `;
        
        this.addOutput('', contactInfo);
        this.addOutput('', '💡 Tip: Type "report" to quickly report bugs or "feedback" for suggestions');
    }

    supportCommand(args) {
        const supportText = `
🛠️  TECHNICAL SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Common Issues & Solutions:

❓ Visual Editor Not Working
  → Enable JavaScript in your browser
  → Try refreshing the page
  → Check browser console for errors

❓ Files Won't Upload
  → Ensure files are under 10MB
  → Check file format (HTML, CSS, JS supported)
  → Try using "Select Files" instead of drag-drop

❓ GitHub Integration Issues
  → Verify your access token has repo permissions
  → Check repository exists and you have access
  → Ensure branch name is correct

❓ Netlify Deployment Fails
  → Verify access token is valid
  → Check site name availability
  → Try ZIP method instead of file digest

❓ Performance Issues
  → Close unused browser tabs
  → Try incognito/private mode
  → Clear browser cache and reload

📞 Still need help? Type 'contact' for human support
        `;
        
        this.addOutput('', supportText);
    }

    aboutCommand(args) {
        const aboutText = `
╔═══════════════════════════════════════════════════════════╗
║                    ECHO HTML EDITOR                       ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  🎯 A professional web-based HTML editor with:           ║
║     • Visual click-to-edit functionality                 ║
║     • Folder upload and project management               ║
║     • GitHub integration for auto-deployment             ║
║     • Netlify hosting integration                        ║
║     • Resizable workspace panels                         ║
║     • Multi-file support and syntax highlighting         ║
║                                                           ║
║  🤖 Built with Claude Code (https://claude.ai/code)      ║
║  📄 MIT License - Open Source                            ║
║  🌐 GitHub: https://github.com/417ps/echo-html-editor    ║
║  🚀 Live Demo: https://echo-html-editor.netlify.app      ║
║                                                           ║
║  ⭐ Made for developers, designers, and content creators  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `;
        
        this.addOutput('', aboutText);
    }

    clearCommand(args) {
        document.getElementById('terminal-output').innerHTML = '';
    }

    echoCommand(args) {
        this.addOutput('', args.join(' '));
    }

    lsCommand(args) {
        const files = `
📁 Echo HTML Editor Resources:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 README.md          Project documentation
🎨 styles.css          Main stylesheet
⚙️  app.js             Core application logic
🖱️  visual-editor.js   Visual editing functionality
📁 folder-processor.js Project folder management
🐙 github-integration.js GitHub deployment system
☁️  netlify-integration.js Netlify hosting features
📐 resizable-panels.js Workspace customization
🖥️  terminal-interface.js This terminal system
        `;
        
        this.addOutput('', files);
    }

    catCommand(args) {
        if (!args.length) {
            this.addOutput('', 'Usage: cat [filename]', 'error');
            return;
        }
        
        const fileContents = {
            'README.md': 'Echo HTML Editor - A professional web-based HTML editor...',
            'version': 'Echo HTML Editor v2.0.0',
            'features': 'Visual editing, Folder support, GitHub integration, Netlify deployment...'
        };
        
        const filename = args[0];
        if (fileContents[filename]) {
            this.addOutput('', fileContents[filename]);
        } else {
            this.addOutput('', `cat: ${filename}: No such file or directory`, 'error');
        }
    }

    pwdCommand(args) {
        this.addOutput('', this.currentPath);
    }

    whoamiCommand(args) {
        this.addOutput('', 'echo-user (Echo HTML Editor User)');
    }

    dateCommand(args) {
        this.addOutput('', new Date().toString());
    }

    versionCommand(args) {
        const versionInfo = `
Echo HTML Editor v2.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔹 Monaco Editor: v0.44.0
🔹 JavaScript: ES6+
🔹 CSS: Grid & Flexbox
🔹 APIs: GitHub REST API, Netlify API
🔹 Built: ${new Date().toDateString()}
🔹 License: MIT
        `;
        
        this.addOutput('', versionInfo);
    }

    featuresCommand(args) {
        const features = `
🚀 ECHO HTML EDITOR - FEATURE LIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ CORE FEATURES:
  • Monaco Code Editor with syntax highlighting
  • Live HTML preview with iframe isolation
  • Multi-file tab management
  • Auto-save and file modification tracking

✅ VISUAL EDITING:
  • Click-to-select HTML elements
  • Double-click to edit content directly
  • Rich text formatting toolbar
  • Real-time sync with code editor

✅ PROJECT MANAGEMENT:
  • Drag & drop folder upload
  • File tree navigation
  • Support for HTML, CSS, JS, images
  • Project structure visualization

✅ DEPLOYMENT INTEGRATION:
  • GitHub repository connection
  • Auto-deploy on save functionality
  • Netlify hosting integration
  • Deployment history tracking

✅ WORKSPACE CUSTOMIZATION:
  • Resizable panels (sidebar, editor, preview)
  • Toggle split-view mode
  • Fullscreen editing support
  • Persistent layout preferences

✅ DEVELOPER EXPERIENCE:
  • Keyboard shortcuts
  • Command history
  • Error notifications
  • Professional dark theme
        `;
        
        this.addOutput('', features);
    }

    feedbackCommand(args) {
        const feedbackForm = `
📝 FEEDBACK SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We'd love to hear from you! Please share your thoughts:

🌟 What you love about Echo HTML Editor
🐛 Any bugs or issues you've encountered  
💡 Feature requests and suggestions
🎯 Use cases and workflow improvements

📬 Send feedback to:
  • GitHub Issues: https://github.com/417ps/echo-html-editor/issues
  • Email: feedback@echo-editor.com
  • Star the repo if you find it useful! ⭐

Your feedback helps make Echo better for everyone! 🚀
        `;
        
        this.addOutput('', feedbackForm);
    }

    reportCommand(args) {
        const reportTemplate = `
🐛 BUG REPORT TEMPLATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please include the following information:

📋 ISSUE DESCRIPTION:
  [ Describe what happened vs what you expected ]

🔄 STEPS TO REPRODUCE:
  1. [ First step ]
  2. [ Second step ]
  3. [ Third step ]

🌐 ENVIRONMENT:
  • Browser: [ Chrome/Firefox/Safari + version ]
  • OS: [ Windows/Mac/Linux ]
  • Screen size: [ Desktop/Mobile ]

📎 ADDITIONAL INFO:
  • Console errors (F12 → Console)
  • Screenshots if helpful
  • Any recent changes made

📬 Submit report:
  GitHub Issues: https://github.com/417ps/echo-html-editor/issues/new

Thank you for helping improve Echo! 🙏
        `;
        
        this.addOutput('', reportTemplate);
    }

    docsCommand(args) {
        this.addOutput('', '📖 Opening documentation...', 'success');
        window.open('https://github.com/417ps/echo-html-editor#readme', '_blank');
        this.addOutput('', '✅ Documentation opened in new tab');
    }

    exitCommand(args) {
        this.addOutput('', '👋 Goodbye! Press Ctrl+` to reopen terminal', 'success');
        setTimeout(() => this.hide(), 1000);
    }
}

// Add terminal styles
const terminalStyles = `
.terminal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.terminal-overlay.open {
    opacity: 1;
    visibility: visible;
}

.terminal-container {
    width: 90%;
    max-width: 1000px;
    height: 70%;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
    transform: scale(0.9);
    transition: transform 0.3s ease;
}

.terminal-overlay.open .terminal-container {
    transform: scale(1);
}

.terminal-overlay.minimized .terminal-container {
    height: 50px;
}

.terminal-overlay.maximized .terminal-container {
    width: 95%;
    height: 90%;
}

.terminal-header {
    height: 50px;
    background: #161b22;
    border-bottom: 1px solid #30363d;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
}

.terminal-title {
    color: #f0f6fc;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.terminal-title i {
    color: #238636;
}

.terminal-controls {
    display: flex;
    gap: 0.5rem;
}

.terminal-control {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    transition: all 0.2s ease;
}

.terminal-control.minimize {
    background: #d29922;
    color: #0d1117;
}

.terminal-control.maximize {
    background: #238636;
    color: white;
}

.terminal-control.close {
    background: #da3633;
    color: white;
}

.terminal-control:hover {
    transform: scale(1.1);
}

.terminal-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.terminal-output {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    font-size: 0.875rem;
    line-height: 1.4;
}

.terminal-line {
    margin-bottom: 0.25rem;
    word-wrap: break-word;
}

.terminal-separator {
    height: 1px;
    background: #30363d;
    margin: 0.5rem 0;
}

.terminal-prompt {
    color: #238636;
    font-weight: bold;
    margin-right: 0.5rem;
}

.terminal-command {
    color: #79c0ff;
}

.terminal-text {
    color: #f0f6fc;
    white-space: pre-line;
}

.terminal-text.error {
    color: #ff7b72;
}

.terminal-text.success {
    color: #56d364;
}

.terminal-input-line {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #161b22;
    border-top: 1px solid #30363d;
}

.terminal-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #f0f6fc;
    font-family: inherit;
    font-size: 0.875rem;
    outline: none;
    margin-left: 0.5rem;
}

.terminal-input::placeholder {
    color: #6e7681;
}

/* Scrollbar styling */
.terminal-output::-webkit-scrollbar {
    width: 8px;
}

.terminal-output::-webkit-scrollbar-track {
    background: #0d1117;
}

.terminal-output::-webkit-scrollbar-thumb {
    background: #30363d;
    border-radius: 4px;
}

.terminal-output::-webkit-scrollbar-thumb:hover {
    background: #484f58;
}

/* Hide terminal when minimized */
.terminal-overlay.minimized .terminal-body {
    display: none;
}

/* Responsive design */
@media (max-width: 768px) {
    .terminal-container {
        width: 95%;
        height: 80%;
    }
    
    .terminal-overlay.maximized .terminal-container {
        width: 98%;
        height: 95%;
    }
}
`;

// Inject terminal styles
const terminalStyleSheet = document.createElement('style');
terminalStyleSheet.textContent = terminalStyles;
document.head.appendChild(terminalStyleSheet);