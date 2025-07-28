// Echo Folder Processor - Handle folder uploads and project management

class FolderProcessor {
    constructor(mainEditor) {
        this.mainEditor = mainEditor;
        this.projectFiles = new Map(); // Map of file paths to file data
        this.currentProject = null;
        this.supportedTypes = {
            'html': { icon: 'fa-file-code', editor: 'html', preview: true },
            'htm': { icon: 'fa-file-code', editor: 'html', preview: true },
            'css': { icon: 'fa-file-code', editor: 'css', preview: false },
            'js': { icon: 'fa-file-code', editor: 'javascript', preview: false },
            'json': { icon: 'fa-file-code', editor: 'json', preview: false },
            'md': { icon: 'fa-file-alt', editor: 'markdown', preview: false },
            'txt': { icon: 'fa-file-alt', editor: 'plaintext', preview: false },
            'png': { icon: 'fa-file-image', editor: null, preview: false },
            'jpg': { icon: 'fa-file-image', editor: null, preview: false },
            'jpeg': { icon: 'fa-file-image', editor: null, preview: false },
            'gif': { icon: 'fa-file-image', editor: null, preview: false },
            'svg': { icon: 'fa-file-image', editor: 'xml', preview: false },
            'ico': { icon: 'fa-file-image', editor: null, preview: false }
        };
        
        this.init();
    }

    init() {
        this.enhanceFileUpload();
        this.createProjectPanel();
        this.setupFileTreeEvents();
    }

    enhanceFileUpload() {
        const fileInput = document.getElementById('file-input');
        const dropzone = document.getElementById('upload-dropzone');
        
        // Update file input to accept folders
        fileInput.setAttribute('webkitdirectory', '');
        fileInput.setAttribute('directory', '');
        fileInput.setAttribute('multiple', '');
        fileInput.removeAttribute('accept');
        
        // Update dropzone text
        dropzone.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <h3>Drop files or folders here</h3>
            <p>or click to browse</p>
            <div class="upload-options">
                <button class="upload-option-btn" id="upload-files">
                    <i class="fas fa-file"></i>
                    Select Files
                </button>
                <button class="upload-option-btn" id="upload-folder">
                    <i class="fas fa-folder"></i>
                    Select Folder
                </button>
            </div>
        `;
        
        // Setup upload option buttons
        document.getElementById('upload-files').addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectFiles();
        });
        
        document.getElementById('upload-folder').addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectFolder();
        });
        
        // Override original click handler
        dropzone.removeEventListener('click', dropzone.clickHandler);
        dropzone.addEventListener('click', (e) => {
            if (!e.target.closest('.upload-option-btn')) {
                this.selectFolder();
            }
        });
        
        // Enhanced drop handler
        const originalDrop = dropzone.ondrop;
        dropzone.ondrop = (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            
            const items = e.dataTransfer.items;
            if (items && items.length > 0) {
                this.handleDroppedItems(items);
            } else {
                this.mainEditor.handleFileSelection(e.dataTransfer.files);
            }
        };
    }

    selectFiles() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.html,.htm,.css,.js,.json,.md,.txt,.png,.jpg,.jpeg,.gif,.svg,.ico';
        input.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files, false);
        });
        input.click();
    }

    selectFolder() {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.directory = true;
        input.multiple = true;
        input.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files, true);
        });
        input.click();
    }

    async handleDroppedItems(items) {
        const files = [];
        const entries = [];
        
        // Convert DataTransferItems to entries
        for (let item of items) {
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    entries.push(entry);
                }
            }
        }
        
        // Process entries recursively
        for (let entry of entries) {
            if (entry.isDirectory) {
                await this.processDirectoryEntry(entry, files);
            } else {
                const file = await this.getFileFromEntry(entry);
                if (file) files.push(file);
            }
        }
        
        if (files.length > 0) {
            this.handleFileSelection(files, entries.some(e => e.isDirectory));
        }
    }

    async processDirectoryEntry(directoryEntry, files, path = '') {
        const reader = directoryEntry.createReader();
        
        return new Promise((resolve) => {
            reader.readEntries(async (entries) => {
                for (let entry of entries) {
                    const entryPath = path ? `${path}/${entry.name}` : entry.name;
                    
                    if (entry.isDirectory) {
                        await this.processDirectoryEntry(entry, files, entryPath);
                    } else {
                        const file = await this.getFileFromEntry(entry);
                        if (file) {
                            file.relativePath = entryPath;
                            files.push(file);
                        }
                    }
                }
                resolve();
            });
        });
    }

    async getFileFromEntry(fileEntry) {
        return new Promise((resolve) => {
            fileEntry.file((file) => {
                const ext = this.getFileExtension(file.name);
                if (this.supportedTypes[ext] || file.size < 10 * 1024 * 1024) { // 10MB limit
                    resolve(file);
                } else {
                    resolve(null);
                }
            }, () => resolve(null));
        });
    }

    async handleFileSelection(files, isFolder = false) {
        if (files.length === 0) return;
        
        if (isFolder) {
            await this.processFolder(files);
        } else {
            // Process individual files
            for (let file of files) {
                if (this.isValidFile(file)) {
                    await this.loadFile(file);
                }
            }
        }
        
        this.updateFileTree();
        this.mainEditor.showNotification(`Loaded ${files.length} files`, 'success');
    }

    async processFolder(files) {
        // Determine project name from first file path
        const firstFile = files[0];
        const projectName = this.extractProjectName(firstFile);
        
        this.currentProject = {
            name: projectName,
            files: new Map(),
            structure: {}
        };
        
        // Clear existing files if this is a new project
        this.projectFiles.clear();
        this.mainEditor.openFiles.clear();
        
        // Process all files
        for (let file of files) {
            await this.loadProjectFile(file);
        }
        
        // Build file tree structure
        this.buildProjectStructure();
        
        // Switch to Files tab to show the project
        this.mainEditor.switchTab('files');
    }

    extractProjectName(file) {
        const path = file.webkitRelativePath || file.relativePath || file.name;
        const parts = path.split('/');
        return parts[0] || 'Untitled Project';
    }

    async loadProjectFile(file) {
        try {
            const relativePath = file.webkitRelativePath || file.relativePath || file.name;
            const extension = this.getFileExtension(file.name);
            const fileType = this.supportedTypes[extension];
            
            let content = null;
            if (fileType && fileType.editor) {
                content = await this.readFileContent(file);
            }
            
            const fileData = {
                id: this.generateFileId(relativePath),
                name: file.name,
                path: relativePath,
                content: content,
                originalContent: content,
                size: file.size,
                lastModified: new Date(file.lastModified),
                isModified: false,
                type: extension,
                fileType: fileType,
                file: file // Store the original file for binary data
            };
            
            this.projectFiles.set(relativePath, fileData);
            
            // Add to main editor if it's an editable file
            if (content !== null) {
                this.mainEditor.openFiles.set(fileData.id, fileData);
            }
            
        } catch (error) {
            console.warn(`Failed to load file ${file.name}:`, error);
        }
    }

    async loadFile(file) {
        const extension = this.getFileExtension(file.name);
        const fileType = this.supportedTypes[extension];
        
        if (!fileType) {
            this.mainEditor.showNotification(`Unsupported file type: ${extension}`, 'warning');
            return;
        }
        
        try {
            let content = null;
            if (fileType.editor) {
                content = await this.readFileContent(file);
            }
            
            const fileData = {
                id: this.generateFileId(file.name),
                name: file.name,
                path: file.name,
                content: content,
                originalContent: content,
                size: file.size,
                lastModified: new Date(file.lastModified),
                isModified: false,
                type: extension,
                fileType: fileType,
                file: file
            };
            
            if (content !== null) {
                this.mainEditor.openFiles.set(fileData.id, fileData);
                this.mainEditor.addFileToList(fileData);
                this.mainEditor.addFileTab(fileData);
                this.mainEditor.switchToFile(fileData.id);
            }
            
        } catch (error) {
            this.mainEditor.showNotification(`Error loading file: ${error.message}`, 'error');
        }
    }

    buildProjectStructure() {
        const structure = {};
        
        for (let [path, fileData] of this.projectFiles) {
            const parts = path.split('/');
            let current = structure;
            
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                
                if (i === parts.length - 1) {
                    // This is a file
                    current[part] = {
                        type: 'file',
                        data: fileData
                    };
                } else {
                    // This is a directory
                    if (!current[part]) {
                        current[part] = {
                            type: 'directory',
                            children: {}
                        };
                    }
                    current = current[part].children;
                }
            }
        }
        
        if (this.currentProject) {
            this.currentProject.structure = structure;
        }
    }

    createProjectPanel() {
        // Enhance the existing files tab
        const filesTab = document.getElementById('files-tab');
        const fileManager = filesTab.querySelector('.file-manager');
        
        fileManager.innerHTML = `
            <div class="project-header">
                <h4>
                    <i class="fas fa-folder-open"></i>
                    <span id="project-name">Project Files</span>
                </h4>
                <div class="project-actions">
                    <button class="control-btn" id="refresh-project" title="Refresh Project">
                        <i class="fas fa-sync"></i>
                    </button>
                    <button class="control-btn" id="collapse-all" title="Collapse All">
                        <i class="fas fa-compress"></i>
                    </button>
                    <button class="control-btn" id="expand-all" title="Expand All">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
            <div class="file-tree" id="file-tree">
                <div class="no-project">
                    <i class="fas fa-folder-plus"></i>
                    <p>No project loaded</p>
                    <small>Upload files or folders to get started</small>
                </div>
            </div>
        `;
    }

    setupFileTreeEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#refresh-project')) {
                this.refreshProject();
            } else if (e.target.closest('#collapse-all')) {
                this.collapseAll();
            } else if (e.target.closest('#expand-all')) {
                this.expandAll();
            }
        });
    }

    updateFileTree() {
        const fileTree = document.getElementById('file-tree');
        const projectName = document.getElementById('project-name');
        
        if (!this.currentProject || this.projectFiles.size === 0) {
            fileTree.innerHTML = `
                <div class="no-project">
                    <i class="fas fa-folder-plus"></i>
                    <p>No project loaded</p>
                    <small>Upload files or folders to get started</small>
                </div>
            `;
            projectName.textContent = 'Project Files';
            return;
        }
        
        projectName.textContent = this.currentProject.name;
        fileTree.innerHTML = this.renderFileTree(this.currentProject.structure);
    }

    renderFileTree(structure, level = 0) {
        let html = '';
        
        const entries = Object.entries(structure).sort(([a, dataA], [b, dataB]) => {
            // Directories first, then files
            if (dataA.type !== dataB.type) {
                return dataA.type === 'directory' ? -1 : 1;
            }
            return a.localeCompare(b);
        });
        
        for (let [name, item] of entries) {
            const indent = level * 20;
            
            if (item.type === 'directory') {
                html += `
                    <div class="tree-item directory" style="padding-left: ${indent}px">
                        <div class="tree-node" data-type="directory">
                            <i class="fas fa-chevron-right tree-toggle"></i>
                            <i class="fas fa-folder tree-icon"></i>
                            <span class="tree-name">${name}</span>
                        </div>
                        <div class="tree-children">
                            ${this.renderFileTree(item.children, level + 1)}
                        </div>
                    </div>
                `;
            } else {
                const fileData = item.data;
                const icon = fileData.fileType ? fileData.fileType.icon : 'fa-file';
                const canEdit = fileData.fileType && fileData.fileType.editor;
                
                html += `
                    <div class="tree-item file ${canEdit ? 'editable' : ''}" 
                         style="padding-left: ${indent}px"
                         data-file-path="${fileData.path}"
                         data-file-id="${fileData.id}">
                        <div class="tree-node" data-type="file">
                            <i class="fas ${icon} tree-icon"></i>
                            <span class="tree-name">${name}</span>
                            <span class="file-size">${this.formatFileSize(fileData.size)}</span>
                        </div>
                    </div>
                `;
            }
        }
        
        return html;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    refreshProject() {
        if (this.currentProject) {
            this.updateFileTree();
            this.mainEditor.showNotification('Project refreshed', 'info');
        }
    }

    collapseAll() {
        document.querySelectorAll('.tree-item.directory').forEach(item => {
            item.classList.remove('expanded');
        });
    }

    expandAll() {
        document.querySelectorAll('.tree-item.directory').forEach(item => {
            item.classList.add('expanded');
        });
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

    getFileExtension(fileName) {
        return fileName.split('.').pop().toLowerCase();
    }

    isValidFile(file) {
        const ext = this.getFileExtension(file.name);
        return this.supportedTypes[ext] && file.size < 10 * 1024 * 1024; // 10MB limit
    }
}

// Add event delegation for file tree interactions
document.addEventListener('click', (e) => {
    const treeNode = e.target.closest('.tree-node');
    if (!treeNode) return;
    
    if (treeNode.dataset.type === 'directory') {
        const directory = treeNode.closest('.tree-item.directory');
        const toggle = treeNode.querySelector('.tree-toggle');
        
        directory.classList.toggle('expanded');
        
        if (directory.classList.contains('expanded')) {
            toggle.style.transform = 'rotate(90deg)';
        } else {
            toggle.style.transform = 'rotate(0deg)';
        }
    } else if (treeNode.dataset.type === 'file') {
        const fileItem = treeNode.closest('.tree-item.file');
        const fileId = fileItem.dataset.fileId;
        
        if (fileItem.classList.contains('editable') && fileId) {
            // Switch to the file in the editor
            if (window.editor && window.editor.openFiles.has(fileId)) {
                window.editor.switchToFile(fileId);
                window.editor.switchTab('editor');
            }
        }
    }
});

// Add folder processor styles
const folderProcessorStyles = `
.upload-options {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
}

.upload-option-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--tertiary-bg);
    border: 1px solid var(--border-default);
    border-radius: 6px;
    color: var(--primary-text);
    cursor: pointer;
    transition: var(--transition-fast);
    font-size: 0.875rem;
}

.upload-option-btn:hover {
    background: var(--quaternary-bg);
    border-color: var(--accent-primary);
}

.project-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
}

.project-header h4 {
    margin: 0;
}

.project-actions {
    display: flex;
    gap: 0.25rem;
}

.file-tree {
    max-height: 400px;
    overflow-y: auto;
}

.no-project {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--secondary-text);
}

.no-project i {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: var(--muted-text);
}

.no-project p {
    margin-bottom: 0.5rem;
    color: var(--primary-text);
}

.tree-item {
    margin-bottom: 1px;
}

.tree-node {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: var(--transition-fast);
    position: relative;
}

.tree-node:hover {
    background: var(--tertiary-bg);
}

.tree-item.file.editable .tree-node:hover {
    background: rgba(35, 134, 54, 0.1);
}

.tree-toggle {
    width: 12px;
    text-align: center;
    transition: transform 0.2s ease;
    color: var(--secondary-text);
    font-size: 0.75rem;
}

.tree-icon {
    color: var(--accent-secondary);
    font-size: 0.875rem;
    width: 16px;
    text-align: center;
}

.tree-item.directory .tree-icon {
    color: var(--accent-warning);
}

.tree-name {
    flex: 1;
    font-size: 0.875rem;
    color: var(--primary-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.file-size {
    font-size: 0.75rem;
    color: var(--secondary-text);
}

.tree-children {
    display: none;
}

.tree-item.directory.expanded .tree-children {
    display: block;
}

.tree-item.directory.expanded .tree-toggle {
    transform: rotate(90deg);
}

.tree-item.file.editable {
    position: relative;
}

.tree-item.file.editable::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--accent-primary);
    border-radius: 0 2px 2px 0;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.tree-item.file.editable:hover::after {
    opacity: 1;
}
`;

// Inject folder processor styles
const folderStyleSheet = document.createElement('style');
folderStyleSheet.textContent = folderProcessorStyles;
document.head.appendChild(folderStyleSheet);