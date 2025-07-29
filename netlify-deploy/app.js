// Echo HTML Editor - Main Application Logic

class EchoHTMLEditor {
    constructor() {
        this.editor = null;
        this.currentFile = null;
        this.openFiles = new Map();
        this.collaborators = new Set();
        
        this.init();
    }

    async init() {
        await this.loadMonacoEditor();
        this.setupEventListeners();
        this.hideLoadingScreen();
        this.setupFileUpload();
        this.setupTabNavigation();
    }

    async loadMonacoEditor() {
        return new Promise((resolve) => {
            require.config({ 
                paths: { 
                    'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' 
                }
            });
            
            require(['vs/editor/editor.main'], () => {
                monaco.editor.defineTheme('echo-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                        { token: '', foreground: 'f0f6fc' },
                        { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
                        { token: 'keyword', foreground: 'ff7b72' },
                        { token: 'string', foreground: 'a5d6ff' },
                        { token: 'number', foreground: '79c0ff' },
                        { token: 'tag', foreground: '7ee787' },
                        { token: 'attribute.name', foreground: 'ffa657' },
                        { token: 'attribute.value', foreground: 'a5d6ff' },
                    ],
                    colors: {
                        'editor.background': '#0d1117',
                        'editor.foreground': '#f0f6fc',
                        'editor.lineHighlightBackground': '#161b22',
                        'editor.selectionBackground': '#264f78',
                        'editor.inactiveSelectionBackground': '#3a3d41',
                        'editorCursor.foreground': '#f0f6fc',
                        'editorWhitespace.foreground': '#484f58',
                        'editorLineNumber.foreground': '#8b949e',
                        'editorLineNumber.activeForeground': '#f0f6fc',
                        'editorGutter.background': '#0d1117',
                        'editorWidget.background': '#161b22',
                        'editorWidget.border': '#30363d',
                        'editorSuggestWidget.background': '#161b22',
                        'editorSuggestWidget.border': '#30363d',
                        'editorSuggestWidget.selectedBackground': '#21262d',
                    }
                });

                this.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                    value: '<!-- Welcome to Echo HTML Editor -->\n<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Your HTML Document</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n    <p>Start editing your HTML here...</p>\n</body>\n</html>',
                    language: 'html',
                    theme: 'echo-dark',
                    fontFamily: 'SF Mono, Monaco, Inconsolata, Fira Code, monospace',
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    folding: true,
                    bracketPairColorization: { enabled: true },
                    guides: {
                        bracketPairs: true,
                        indentation: true
                    }
                });

                // Setup editor event listeners
                this.editor.onDidChangeModelContent(() => {
                    this.updatePreview();
                    this.updateStatus();
                    this.markFileAsModified();
                });

                this.editor.onDidChangeCursorPosition(() => {
                    this.updateCursorPosition();
                });

                // Initial preview update
                this.updatePreview();
                resolve();
            });
        });
    }

    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.closest('.nav-btn').dataset.tab;
                this.switchTab(tab);
            });
        });

        // Control buttons
        document.getElementById('split-view-btn').addEventListener('click', () => {
            this.toggleSplitView();
        });

        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('refresh-preview').addEventListener('click', () => {
            this.updatePreview();
        });

        document.getElementById('open-external').addEventListener('click', () => {
            this.openPreviewInNewTab();
        });

        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveCurrentFile();
        });

        document.getElementById('download-btn').addEventListener('click', () => {
            this.downloadCurrentFile();
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            if (this.editor) {
                this.editor.layout();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    setupFileUpload() {
        const dropzone = document.getElementById('upload-dropzone');
        const fileInput = document.getElementById('file-input');

        // Click to browse
        dropzone.addEventListener('click', () => {
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // Drag and drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            this.handleFileSelection(e.dataTransfer.files);
        });
    }

    setupTabNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');
    }

    async handleFileSelection(files) {
        for (let file of files) {
            if (this.isValidHTMLFile(file)) {
                await this.loadFile(file);
            } else {
                this.showNotification(`Invalid file: ${file.name}. Please select HTML files only.`, 'error');
            }
        }
    }

    isValidHTMLFile(file) {
        const validExtensions = ['.html', '.htm'];
        const fileName = file.name.toLowerCase();
        return validExtensions.some(ext => fileName.endsWith(ext)) && file.size < 10 * 1024 * 1024; // 10MB limit
    }

    async loadFile(file) {
        try {
            const content = await this.readFileContent(file);
            const fileId = this.generateFileId(file.name);
            
            const fileData = {
                id: fileId,
                name: file.name,
                content: content,
                originalContent: content,
                size: file.size,
                lastModified: new Date(),
                isModified: false
            };

            this.openFiles.set(fileId, fileData);
            this.addFileToList(fileData);
            this.addFileTab(fileData);
            this.switchToFile(fileId);
            
            this.showNotification(`File "${file.name}" loaded successfully`, 'success');
        } catch (error) {
            this.showNotification(`Error loading file: ${error.message}`, 'error');
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    generateFileId(fileName) {
        return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    addFileToList(fileData) {
        const fileItems = document.getElementById('file-items');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.fileId = fileData.id;
        
        fileItem.innerHTML = `
            <i class="fas fa-file-code"></i>
            <div class="file-info">
                <div class="file-name">${fileData.name}</div>
                <div class="file-size">${this.formatFileSize(fileData.size)}</div>
            </div>
            <div class="file-actions">
                <button class="file-action" title="Close" onclick="editor.closeFile('${fileData.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        fileItem.addEventListener('click', () => {
            this.switchToFile(fileData.id);
        });

        fileItems.appendChild(fileItem);
    }

    addFileTab(fileData) {
        const fileTabs = document.getElementById('file-tabs');
        const tab = document.createElement('button');
        tab.className = 'file-tab';
        tab.dataset.fileId = fileData.id;
        
        tab.innerHTML = `
            <i class="fas fa-file-code"></i>
            <span>${fileData.name}</span>
            <button class="tab-close" onclick="editor.closeFile('${fileData.id}')" title="Close">
                <i class="fas fa-times"></i>
            </button>
        `;

        tab.addEventListener('click', (e) => {
            if (e.target.closest('.tab-close')) return;
            this.switchToFile(fileData.id);
        });

        fileTabs.appendChild(tab);
    }

    switchToFile(fileId) {
        const fileData = this.openFiles.get(fileId);
        if (!fileData) return;

        this.currentFile = fileId;
        
        // Update editor content
        this.editor.setValue(fileData.content);
        
        // Update UI
        this.updateActiveFileTab(fileId);
        this.updateActiveFileItem(fileId);
        this.updatePreview();
        this.updateStatus();
    }

    updateActiveFileTab(fileId) {
        document.querySelectorAll('.file-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-file-id="${fileId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }

    updateActiveFileItem(fileId) {
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    closeFile(fileId) {
        const fileData = this.openFiles.get(fileId);
        if (!fileData) return;

        if (fileData.isModified) {
            if (!confirm(`File "${fileData.name}" has unsaved changes. Close anyway?`)) {
                return;
            }
        }

        // Remove from data structures
        this.openFiles.delete(fileId);
        
        // Remove from UI
        const tab = document.querySelector(`[data-file-id="${fileId}"]`);
        if (tab) tab.remove();
        
        const item = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
        if (item) item.remove();

        // Switch to another file if this was the current file
        if (this.currentFile === fileId) {
            const remainingFiles = Array.from(this.openFiles.keys());
            if (remainingFiles.length > 0) {
                this.switchToFile(remainingFiles[0]);
            } else {
                this.currentFile = null;
                this.editor.setValue('<!-- Welcome to Echo HTML Editor -->\n<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Your HTML Document</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n    <p>Start editing your HTML here...</p>\n</body>\n</html>');
                this.updatePreview();
                this.updateStatus();
            }
        }
    }

    updatePreview() {
        const content = this.editor.getValue();
        const preview = document.getElementById('preview-iframe');
        
        // Create a blob URL for the HTML content
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Update iframe
        preview.src = url;
        
        // Clean up previous blob URL
        if (preview.dataset.prevUrl) {
            URL.revokeObjectURL(preview.dataset.prevUrl);
        }
        preview.dataset.prevUrl = url;
    }

    markFileAsModified() {
        if (!this.currentFile) return;
        
        const fileData = this.openFiles.get(this.currentFile);
        if (!fileData) return;
        
        const currentContent = this.editor.getValue();
        const wasModified = fileData.isModified;
        fileData.isModified = currentContent !== fileData.originalContent;
        fileData.content = currentContent;
        
        // Update UI if modification status changed
        if (wasModified !== fileData.isModified) {
            this.updateFileTabModifiedState(this.currentFile);
        }
    }

    updateFileTabModifiedState(fileId) {
        const tab = document.querySelector(`[data-file-id="${fileId}"]`);
        const fileData = this.openFiles.get(fileId);
        
        if (tab && fileData) {
            const nameSpan = tab.querySelector('span');
            if (fileData.isModified && !nameSpan.textContent.startsWith('● ')) {
                nameSpan.textContent = `● ${fileData.name}`;
            } else if (!fileData.isModified && nameSpan.textContent.startsWith('● ')) {
                nameSpan.textContent = fileData.name;
            }
        }
    }

    updateStatus() {
        const fileStatus = document.getElementById('file-status');
        const lastSaved = document.getElementById('last-saved');
        
        if (this.currentFile) {
            const fileData = this.openFiles.get(this.currentFile);
            const status = fileData.isModified ? 'Modified' : 'Saved';
            fileStatus.textContent = `${fileData.name} - ${status}`;
            lastSaved.textContent = `Last saved: ${fileData.lastModified.toLocaleTimeString()}`;
        } else {
            fileStatus.textContent = 'No file selected';
            lastSaved.textContent = 'Never saved';
        }
    }

    updateCursorPosition() {
        const position = this.editor.getPosition();
        const cursorPos = document.getElementById('cursor-position');
        cursorPos.textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
    }

    toggleSplitView() {
        if (window.resizablePanels) {
            const isHidden = window.resizablePanels.togglePreviewPane();
            const splitBtn = document.getElementById('split-view-btn');
            
            if (isHidden) {
                splitBtn.classList.remove('active');
            } else {
                splitBtn.classList.add('active');
            }
        } else {
            // Fallback for when resizable panels isn't loaded yet
            const previewPane = document.getElementById('preview-pane');
            const splitBtn = document.getElementById('split-view-btn');
            
            if (previewPane.style.display === 'none') {
                previewPane.style.display = 'flex';
                splitBtn.classList.add('active');
            } else {
                previewPane.style.display = 'none';
                splitBtn.classList.remove('active');
            }
            
            // Trigger editor layout update
            setTimeout(() => {
                this.editor.layout();
            }, 300);
        }
    }

    toggleFullscreen() {
        const editorContainer = document.querySelector('.editor-container');
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        
        if (document.fullscreenElement) {
            document.exitFullscreen();
            fullscreenBtn.classList.remove('active');
        } else {
            editorContainer.requestFullscreen();
            fullscreenBtn.classList.add('active');
        }
    }

    openPreviewInNewTab() {
        const content = this.editor.getValue();
        const newWindow = window.open();
        newWindow.document.write(content);
        newWindow.document.close();
    }

    saveCurrentFile() {
        if (!this.currentFile) {
            this.showNotification('No file to save', 'warning');
            return;
        }
        
        const fileData = this.openFiles.get(this.currentFile);
        fileData.originalContent = fileData.content;
        fileData.isModified = false;
        fileData.lastModified = new Date();
        
        this.updateFileTabModifiedState(this.currentFile);
        this.updateStatus();
        this.showNotification(`File "${fileData.name}" saved successfully`, 'success');
    }

    downloadCurrentFile() {
        const content = this.editor.getValue();
        const fileName = this.currentFile ? 
            this.openFiles.get(this.currentFile).name : 
            'untitled.html';
        
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification(`File "${fileName}" downloaded`, 'success');
    }

    handleKeyboardShortcuts(e) {
        const isCtrl = e.ctrlKey || e.metaKey;
        
        if (isCtrl && e.key === 's') {
            e.preventDefault();
            this.saveCurrentFile();
        } else if (isCtrl && e.key === 'o') {
            e.preventDefault();
            document.getElementById('file-input').click();
        } else if (isCtrl && e.key === 'w') {
            e.preventDefault();
            if (this.currentFile) {
                this.closeFile(this.currentFile);
            }
        } else if (isCtrl && e.key === 'Enter') {
            e.preventDefault();
            this.updatePreview();
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }, 1000);
    }
}

// Initialize the application
let editor;
let visualEditor;
let githubIntegration;
let folderProcessor;
let resizablePanels;
let netlifyIntegration;

document.addEventListener('DOMContentLoaded', () => {
    editor = new EchoHTMLEditor();
    
    // Initialize additional modules after main editor is ready
    setTimeout(() => {
        visualEditor = new VisualEditor(editor);
        githubIntegration = new GitHubIntegration(editor);
        folderProcessor = new FolderProcessor(editor);
        resizablePanels = new ResizablePanels(editor);
        netlifyIntegration = new NetlifyIntegration(editor);
    }, 1000);
});

// Add notification styles
const notificationStyles = `
.notification {
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
    z-index: 1000;
    max-width: 400px;
    box-shadow: var(--shadow-lg);
    animation: slideInRight 0.3s ease;
}

.notification-success {
    background: linear-gradient(135deg, #238636, #2ea043);
    color: white;
}

.notification-error {
    background: linear-gradient(135deg, #da3633, #f85149);
    color: white;
}

.notification-warning {
    background: linear-gradient(135deg, #d29922, #f2cc60);
    color: #0d1117;
}

.notification-info {
    background: linear-gradient(135deg, #1f6feb, #388bfd);
    color: white;
}

.notification-close {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    opacity: 0.8;
    transition: opacity 0.2s ease;
}

.notification-close:hover {
    opacity: 1;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);