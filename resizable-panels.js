// Echo Resizable Panels - Drag to resize editor sections

class ResizablePanels {
    constructor(mainEditor) {
        this.mainEditor = mainEditor;
        this.isDragging = false;
        this.currentHandle = null;
        this.startX = 0;
        this.startWidth = 0;
        this.panels = {};
        
        this.init();
    }

    init() {
        this.setupPanelStructure();
        this.createResizeHandles();
        this.loadSavedSizes();
        this.setupEventListeners();
        
        // Make resizablePanels globally accessible
        window.resizablePanels = this;
    }

    setupPanelStructure() {
        const mainContent = document.querySelector('.main-content');
        mainContent.className = 'main-content resizable-layout';
        
        // Store panel references
        this.panels = {
            sidebar: document.querySelector('.sidebar'),
            editor: document.querySelector('.editor-container'),
            preview: document.querySelector('.preview-pane')
        };
        
        // Set initial sizes if not already set
        if (!this.panels.sidebar.style.width) {
            this.panels.sidebar.style.width = '300px';
        }
        if (!this.panels.preview.style.width) {
            this.panels.preview.style.width = '50%';
        }
    }

    createResizeHandles() {
        // Handle between sidebar and editor
        const sidebarHandle = document.createElement('div');
        sidebarHandle.className = 'resize-handle resize-handle-vertical';
        sidebarHandle.dataset.target = 'sidebar';
        sidebarHandle.innerHTML = '<div class="resize-handle-line"></div>';
        
        // Handle between editor and preview
        const editorHandle = document.createElement('div');
        editorHandle.className = 'resize-handle resize-handle-vertical';
        editorHandle.dataset.target = 'editor-preview';
        editorHandle.innerHTML = '<div class="resize-handle-line"></div>';
        
        // Insert handles
        this.panels.sidebar.insertAdjacentElement('afterend', sidebarHandle);
        
        // Find the editor workspace and insert handle before preview
        const editorWorkspace = document.querySelector('.editor-workspace');
        const editorPane = editorWorkspace.querySelector('.editor-pane');
        editorPane.insertAdjacentElement('afterend', editorHandle);
        
        // Store handle references
        this.handles = {
            sidebar: sidebarHandle,
            editorPreview: editorHandle
        };
    }

    setupEventListeners() {
        // Mouse events for resize handles
        Object.values(this.handles).forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                this.startResize(e, handle);
            });
        });

        document.addEventListener('mousemove', (e) => {
            this.handleResize(e);
        });

        document.addEventListener('mouseup', () => {
            this.stopResize();
        });

        // Double-click to reset panel sizes
        Object.values(this.handles).forEach(handle => {
            handle.addEventListener('dblclick', (e) => {
                this.resetPanelSize(handle);
            });
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            this.adjustPanelsOnWindowResize();
        });
    }

    startResize(e, handle) {
        e.preventDefault();
        
        this.isDragging = true;
        this.currentHandle = handle;
        this.startX = e.clientX;
        
        const target = handle.dataset.target;
        
        if (target === 'sidebar') {
            this.startWidth = this.panels.sidebar.offsetWidth;
        } else if (target === 'editor-preview') {
            const editorPane = document.querySelector('.editor-pane');
            this.startWidth = editorPane.offsetWidth;
        }
        
        // Add dragging class for visual feedback
        document.body.classList.add('resizing');
        handle.classList.add('dragging');
        
        // Disable text selection
        document.body.style.userSelect = 'none';
        
        // Disable iframe pointer events to prevent interference
        const iframe = document.getElementById('preview-iframe');
        if (iframe) {
            iframe.style.pointerEvents = 'none';
        }
    }

    handleResize(e) {
        if (!this.isDragging || !this.currentHandle) return;
        
        const deltaX = e.clientX - this.startX;
        const target = this.currentHandle.dataset.target;
        
        if (target === 'sidebar') {
            this.resizeSidebar(deltaX);
        } else if (target === 'editor-preview') {
            this.resizeEditorPreview(deltaX);
        }
    }

    resizeSidebar(deltaX) {
        const newWidth = Math.max(200, Math.min(600, this.startWidth + deltaX));
        this.panels.sidebar.style.width = `${newWidth}px`;
        
        // Adjust editor container margin
        const editorContainer = this.panels.editor;
        editorContainer.style.marginLeft = '0';
    }

    resizeEditorPreview(deltaX) {
        const editorWorkspace = document.querySelector('.editor-workspace');
        const editorPane = document.querySelector('.editor-pane');
        const workspaceWidth = editorWorkspace.offsetWidth;
        
        const newEditorWidth = Math.max(200, Math.min(workspaceWidth - 200, this.startWidth + deltaX));
        const newPreviewWidth = workspaceWidth - newEditorWidth;
        
        editorPane.style.width = `${newEditorWidth}px`;
        this.panels.preview.style.width = `${newPreviewWidth}px`;
        
        // Trigger Monaco editor layout update
        setTimeout(() => {
            if (this.mainEditor && this.mainEditor.editor) {
                this.mainEditor.editor.layout();
            }
        }, 50);
    }

    stopResize() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.currentHandle.classList.remove('dragging');
        this.currentHandle = null;
        
        // Remove dragging class
        document.body.classList.remove('resizing');
        
        // Re-enable text selection
        document.body.style.userSelect = '';
        
        // Re-enable iframe pointer events
        const iframe = document.getElementById('preview-iframe');
        if (iframe) {
            iframe.style.pointerEvents = '';
        }
        
        // Save current sizes
        this.savePanelSizes();
        
        // Make resizablePanels globally accessible
        window.resizablePanels = this;
        
        // Final Monaco editor layout update
        setTimeout(() => {
            if (this.mainEditor && this.mainEditor.editor) {
                this.mainEditor.editor.layout();
            }
        }, 100);
    }

    resetPanelSize(handle) {
        const target = handle.dataset.target;
        
        if (target === 'sidebar') {
            this.panels.sidebar.style.width = '300px';
        } else if (target === 'editor-preview') {
            const editorPane = document.querySelector('.editor-pane');
            const editorWorkspace = document.querySelector('.editor-workspace');
            const workspaceWidth = editorWorkspace.offsetWidth;
            
            editorPane.style.width = `${workspaceWidth / 2}px`;
            this.panels.preview.style.width = `${workspaceWidth / 2}px`;
        }
        
        this.savePanelSizes();
        
        // Update Monaco editor layout
        setTimeout(() => {
            if (this.mainEditor && this.mainEditor.editor) {
                this.mainEditor.editor.layout();
            }
        }, 100);
        
        this.mainEditor.showNotification('Panel size reset to default', 'info');
    }

    adjustPanelsOnWindowResize() {
        // Ensure panels don't exceed window bounds
        const windowWidth = window.innerWidth;
        const sidebarWidth = this.panels.sidebar.offsetWidth;
        
        if (sidebarWidth > windowWidth * 0.5) {
            this.panels.sidebar.style.width = `${windowWidth * 0.3}px`;
        }
        
        // Update Monaco editor layout
        setTimeout(() => {
            if (this.mainEditor && this.mainEditor.editor) {
                this.mainEditor.editor.layout();
            }
        }, 100);
    }

    savePanelSizes() {
        const sizes = {
            sidebar: this.panels.sidebar.style.width,
            editorPane: document.querySelector('.editor-pane')?.style.width || '',
            preview: this.panels.preview.style.width
        };
        
        localStorage.setItem('echo-panel-sizes', JSON.stringify(sizes));
    }

    loadSavedSizes() {
        try {
            const saved = localStorage.getItem('echo-panel-sizes');
            if (!saved) return;
            
            const sizes = JSON.parse(saved);
            
            if (sizes.sidebar) {
                this.panels.sidebar.style.width = sizes.sidebar;
            }
            
            if (sizes.editorPane) {
                const editorPane = document.querySelector('.editor-pane');
                if (editorPane) {
                    editorPane.style.width = sizes.editorPane;
                }
            }
            
            if (sizes.preview) {
                this.panels.preview.style.width = sizes.preview;
            }
            
        } catch (error) {
            console.warn('Failed to load saved panel sizes:', error);
        }
    }

    togglePreviewPane() {
        const isHidden = this.panels.preview.style.display === 'none';
        
        if (isHidden) {
            this.panels.preview.style.display = 'flex';
            this.handles.editorPreview.style.display = 'block';
        } else {
            this.panels.preview.style.display = 'none';
            this.handles.editorPreview.style.display = 'none';
        }
        
        // Update Monaco editor layout
        setTimeout(() => {
            if (this.mainEditor && this.mainEditor.editor) {
                this.mainEditor.editor.layout();
            }
        }, 100);
        
        return !isHidden;
    }
}

// Add resizable panels styles
const resizablePanelsStyles = `
.resizable-layout {
    position: relative;
}

.resize-handle {
    position: absolute;
    z-index: 100;
    background: transparent;
    transition: background-color 0.2s ease;
}

.resize-handle-vertical {
    width: 6px;
    top: 0;
    bottom: 0;
    cursor: col-resize;
    margin-left: -3px;
}

.resize-handle:hover,
.resize-handle.dragging {
    background: var(--accent-primary);
}

.resize-handle-line {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1px;
    height: 30px;
    background: var(--border-default);
    opacity: 0;
    transition: opacity 0.2s ease;
}

.resize-handle:hover .resize-handle-line,
.resize-handle.dragging .resize-handle-line {
    opacity: 1;
}

/* Sidebar positioning */
.sidebar {
    position: relative;
    flex-shrink: 0;
    min-width: 200px;
    max-width: 600px;
}

/* Editor workspace layout */
.editor-workspace {
    position: relative;
    display: flex !important;
}

.editor-pane {
    position: relative;
    flex-shrink: 0;
    min-width: 200px;
}

.preview-pane {
    flex: 1;
    min-width: 200px;
}

/* Handle positioning */
.sidebar + .resize-handle {
    left: 100%;
}

.editor-pane + .resize-handle {
    left: 100%;
}

/* Dragging state */
.resizing {
    cursor: col-resize !important;
}

.resizing * {
    pointer-events: none !important;
}

.resizing .resize-handle {
    pointer-events: auto !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .resize-handle {
        display: none;
    }
    
    .sidebar {
        width: 280px !important;
    }
    
    .editor-workspace {
        flex-direction: column !important;
    }
    
    .editor-pane,
    .preview-pane {
        width: 100% !important;
        min-width: auto !important;
    }
}

/* Visual feedback for panel boundaries */
.editor-pane,
.preview-pane {
    border-right: 1px solid var(--border-default);
}

.preview-pane {
    border-right: none;
}
`;

// Inject resizable panels styles
const resizableStyleSheet = document.createElement('style');
resizableStyleSheet.textContent = resizablePanelsStyles;
document.head.appendChild(resizableStyleSheet);