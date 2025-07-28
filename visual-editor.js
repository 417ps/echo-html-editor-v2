// Echo Visual HTML Editor - Click-to-edit functionality

class VisualEditor {
    constructor(mainEditor) {
        this.mainEditor = mainEditor;
        this.isVisualMode = false;
        this.selectedElement = null;
        this.editingElement = null;
        this.originalContent = '';
        this.editingToolbar = null;
        
        this.init();
    }

    init() {
        this.createVisualModeToggle();
        this.createEditingToolbar();
        this.setupPreviewInteraction();
    }

    createVisualModeToggle() {
        const previewControls = document.querySelector('.preview-controls');
        const visualToggle = document.createElement('button');
        visualToggle.className = 'control-btn';
        visualToggle.id = 'visual-mode-btn';
        visualToggle.title = 'Toggle Visual Editing Mode';
        visualToggle.innerHTML = '<i class="fas fa-edit"></i>';
        
        visualToggle.addEventListener('click', () => {
            this.toggleVisualMode();
        });
        
        previewControls.insertBefore(visualToggle, previewControls.firstChild);
    }

    createEditingToolbar() {
        this.editingToolbar = document.createElement('div');
        this.editingToolbar.className = 'editing-toolbar';
        this.editingToolbar.innerHTML = `
            <div class="toolbar-section">
                <button class="toolbar-btn" data-action="bold" title="Bold">
                    <i class="fas fa-bold"></i>
                </button>
                <button class="toolbar-btn" data-action="italic" title="Italic">
                    <i class="fas fa-italic"></i>
                </button>
                <button class="toolbar-btn" data-action="underline" title="Underline">
                    <i class="fas fa-underline"></i>
                </button>
            </div>
            <div class="toolbar-section">
                <button class="toolbar-btn" data-action="h1" title="Heading 1">H1</button>
                <button class="toolbar-btn" data-action="h2" title="Heading 2">H2</button>
                <button class="toolbar-btn" data-action="h3" title="Heading 3">H3</button>
                <button class="toolbar-btn" data-action="p" title="Paragraph">P</button>
            </div>
            <div class="toolbar-section">
                <button class="toolbar-btn" data-action="link" title="Add Link">
                    <i class="fas fa-link"></i>
                </button>
                <button class="toolbar-btn" data-action="image" title="Add Image">
                    <i class="fas fa-image"></i>
                </button>
                <button class="toolbar-btn" data-action="color" title="Text Color">
                    <i class="fas fa-palette"></i>
                </button>
            </div>
            <div class="toolbar-section">
                <input type="color" id="color-picker" style="display: none;">
                <button class="toolbar-btn toolbar-btn-success" data-action="save" title="Save Changes">
                    <i class="fas fa-check"></i>
                </button>
                <button class="toolbar-btn toolbar-btn-danger" data-action="cancel" title="Cancel">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(this.editingToolbar);
        this.setupToolbarEvents();
    }

    setupToolbarEvents() {
        this.editingToolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('.toolbar-btn');
            if (!btn) return;
            
            const action = btn.dataset.action;
            this.executeToolbarAction(action);
        });
    }

    executeToolbarAction(action) {
        if (!this.editingElement) return;
        
        switch (action) {
            case 'bold':
                document.execCommand('bold');
                break;
            case 'italic':
                document.execCommand('italic');
                break;
            case 'underline':
                document.execCommand('underline');
                break;
            case 'h1':
            case 'h2':
            case 'h3':
            case 'p':
                this.wrapInTag(action.toUpperCase());
                break;
            case 'link':
                this.addLink();
                break;
            case 'image':
                this.addImage();
                break;
            case 'color':
                this.showColorPicker();
                break;
            case 'save':
                this.saveChanges();
                break;
            case 'cancel':
                this.cancelEditing();
                break;
        }
    }

    wrapInTag(tagName) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            
            if (selectedText) {
                const newElement = document.createElement(tagName);
                newElement.textContent = selectedText;
                range.deleteContents();
                range.insertNode(newElement);
            }
        }
    }

    addLink() {
        const url = prompt('Enter URL:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    }

    addImage() {
        const url = prompt('Enter image URL:');
        if (url) {
            document.execCommand('insertImage', false, url);
        }
    }

    showColorPicker() {
        const colorPicker = document.getElementById('color-picker');
        colorPicker.click();
        
        colorPicker.onchange = () => {
            document.execCommand('foreColor', false, colorPicker.value);
        };
    }

    toggleVisualMode() {
        this.isVisualMode = !this.isVisualMode;
        const btn = document.getElementById('visual-mode-btn');
        const previewWrapper = document.querySelector('.preview-wrapper');
        
        if (this.isVisualMode) {
            btn.classList.add('active');
            previewWrapper.classList.add('visual-editing-mode');
            this.enableVisualEditing();
            this.mainEditor.showNotification('Visual editing mode enabled - click on elements to edit', 'info');
        } else {
            btn.classList.remove('active');
            previewWrapper.classList.remove('visual-editing-mode');
            this.disableVisualEditing();
            this.mainEditor.showNotification('Visual editing mode disabled', 'info');
        }
    }

    setupPreviewInteraction() {
        const preview = document.getElementById('preview-iframe');
        
        preview.addEventListener('load', () => {
            if (this.isVisualMode) {
                this.enableVisualEditing();
            }
        });
    }

    enableVisualEditing() {
        const preview = document.getElementById('preview-iframe');
        
        try {
            const doc = preview.contentDocument || preview.contentWindow.document;
            
            // Add editing styles to the iframe
            this.injectEditingStyles(doc);
            
            // Make elements clickable
            this.makeElementsEditable(doc);
            
        } catch (error) {
            console.warn('Cannot access iframe content:', error);
            this.mainEditor.showNotification('Visual editing requires same-origin content', 'warning');
        }
    }

    injectEditingStyles(doc) {
        const styles = `
            <style id="visual-editor-styles">
                .ve-editable:hover {
                    outline: 2px dashed #238636 !important;
                    cursor: pointer !important;
                }
                .ve-editing {
                    outline: 2px solid #238636 !important;
                    background: rgba(35, 134, 54, 0.1) !important;
                }
                .ve-selected {
                    outline: 2px solid #1f6feb !important;
                    background: rgba(31, 111, 235, 0.1) !important;
                }
            </style>
        `;
        
        if (!doc.getElementById('visual-editor-styles')) {
            doc.head.insertAdjacentHTML('beforeend', styles);
        }
    }

    makeElementsEditable(doc) {
        const editableSelectors = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'span', 'div', 'a', 'li', 'td', 'th',
            'blockquote', 'em', 'strong', 'i', 'b'
        ];
        
        editableSelectors.forEach(selector => {
            const elements = doc.querySelectorAll(selector);
            elements.forEach(element => {
                if (!this.isIgnoredElement(element)) {
                    element.classList.add('ve-editable');
                    element.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.selectElement(element);
                    });
                    
                    element.addEventListener('dblclick', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.startEditing(element);
                    });
                }
            });
        });
    }

    isIgnoredElement(element) {
        const ignoredTags = ['script', 'style', 'meta', 'link', 'title'];
        return ignoredTags.includes(element.tagName.toLowerCase()) ||
               element.closest('script, style, meta, link, title');
    }

    selectElement(element) {
        // Clear previous selection
        if (this.selectedElement) {
            this.selectedElement.classList.remove('ve-selected');
        }
        
        // Select new element
        this.selectedElement = element;
        element.classList.add('ve-selected');
        
        // Show element info
        this.showElementInfo(element);
    }

    showElementInfo(element) {
        const tagName = element.tagName.toLowerCase();
        const textContent = element.textContent.trim().substring(0, 50);
        const message = `Selected: <${tagName}> "${textContent}${textContent.length > 50 ? '...' : ''}" - Double-click to edit`;
        
        this.mainEditor.showNotification(message, 'info');
    }

    startEditing(element) {
        if (this.editingElement) {
            this.cancelEditing();
        }
        
        this.editingElement = element;
        this.originalContent = element.innerHTML;
        
        // Make element contenteditable
        element.contentEditable = true;
        element.focus();
        element.classList.add('ve-editing');
        element.classList.remove('ve-selected');
        
        // Position and show toolbar
        this.positionToolbar(element);
        this.showToolbar();
        
        // Handle escape key
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cancelEditing();
            } else if (e.key === 'Enter' && e.ctrlKey) {
                this.saveChanges();
            }
        });
        
        this.mainEditor.showNotification('Editing mode - Use toolbar or Ctrl+Enter to save, Escape to cancel', 'info');
    }

    positionToolbar(element) {
        const preview = document.getElementById('preview-iframe');
        const previewRect = preview.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        // Position toolbar above the element
        const top = previewRect.top + elementRect.top - 50;
        const left = previewRect.left + elementRect.left;
        
        this.editingToolbar.style.top = `${Math.max(60, top)}px`;
        this.editingToolbar.style.left = `${left}px`;
    }

    showToolbar() {
        this.editingToolbar.classList.add('visible');
    }

    hideToolbar() {
        this.editingToolbar.classList.remove('visible');
    }

    saveChanges() {
        if (!this.editingElement) return;
        
        const newContent = this.editingElement.innerHTML;
        
        // Update the main editor content
        this.updateMainEditorContent(this.editingElement, newContent);
        
        // Clean up editing state
        this.finishEditing();
        
        this.mainEditor.showNotification('Changes saved to editor', 'success');
    }

    updateMainEditorContent(element, newContent) {
        const preview = document.getElementById('preview-iframe');
        const doc = preview.contentDocument || preview.contentWindow.document;
        
        // Find the element in the HTML source
        const xpath = this.getElementXPath(element);
        const currentHTML = this.mainEditor.editor.getValue();
        
        // This is a simplified approach - in production, you'd want more sophisticated DOM-to-source mapping
        const updatedHTML = this.replaceElementInHTML(currentHTML, element, newContent);
        
        if (updatedHTML !== currentHTML) {
            this.mainEditor.editor.setValue(updatedHTML);
            this.mainEditor.markFileAsModified();
        }
    }

    getElementXPath(element) {
        const parts = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let index = 0;
            let sibling = element.previousSibling;
            while (sibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === element.tagName) {
                    index++;
                }
                sibling = sibling.previousSibling;
            }
            
            const tagName = element.tagName.toLowerCase();
            const pathIndex = index > 0 ? `[${index + 1}]` : '';
            parts.unshift(tagName + pathIndex);
            element = element.parentNode;
        }
        
        return parts.length ? '/' + parts.join('/') : null;
    }

    replaceElementInHTML(html, element, newContent) {
        // This is a simplified implementation
        // In production, you'd want to use a proper HTML parser
        const tagName = element.tagName.toLowerCase();
        const originalText = this.originalContent;
        const escapedOriginal = this.escapeRegExp(originalText);
        
        const regex = new RegExp(`<${tagName}[^>]*>${escapedOriginal}</${tagName}>`, 'gi');
        const replacement = `<${tagName}${this.getElementAttributes(element)}>${newContent}</${tagName}>`;
        
        return html.replace(regex, replacement);
    }

    getElementAttributes(element) {
        const attributes = [];
        for (let attr of element.attributes) {
            if (attr.name !== 'contenteditable' && !attr.name.startsWith('ve-')) {
                attributes.push(`${attr.name}="${attr.value}"`);
            }
        }
        return attributes.length > 0 ? ' ' + attributes.join(' ') : '';
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    cancelEditing() {
        if (!this.editingElement) return;
        
        // Restore original content
        this.editingElement.innerHTML = this.originalContent;
        
        this.finishEditing();
        this.mainEditor.showNotification('Editing cancelled', 'info');
    }

    finishEditing() {
        if (this.editingElement) {
            this.editingElement.contentEditable = false;
            this.editingElement.classList.remove('ve-editing');
            this.editingElement = null;
        }
        
        this.hideToolbar();
        this.originalContent = '';
    }

    disableVisualEditing() {
        const preview = document.getElementById('preview-iframe');
        
        try {
            const doc = preview.contentDocument || preview.contentWindow.document;
            
            // Remove editing classes and event listeners
            const editableElements = doc.querySelectorAll('.ve-editable');
            editableElements.forEach(element => {
                element.classList.remove('ve-editable', 've-selected', 've-editing');
                element.contentEditable = false;
            });
            
            // Remove injected styles
            const styles = doc.getElementById('visual-editor-styles');
            if (styles) {
                styles.remove();
            }
            
        } catch (error) {
            console.warn('Cannot clean up iframe content:', error);
        }
        
        this.finishEditing();
    }
}

// Add visual editor styles
const visualEditorStyles = `
.visual-editing-mode {
    position: relative;
}

.visual-editing-mode::after {
    content: 'Visual Editing Mode - Click elements to select, double-click to edit';
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(35, 134, 54, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    z-index: 10;
    pointer-events: none;
}

.editing-toolbar {
    position: fixed;
    background: var(--secondary-bg);
    border: 1px solid var(--border-default);
    border-radius: 8px;
    padding: 8px;
    display: flex;
    gap: 8px;
    z-index: 1000;
    box-shadow: var(--shadow-lg);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s ease;
}

.editing-toolbar.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.toolbar-section {
    display: flex;
    gap: 4px;
    padding-right: 8px;
    border-right: 1px solid var(--border-default);
}

.toolbar-section:last-child {
    border-right: none;
    padding-right: 0;
}

.toolbar-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: var(--tertiary-bg);
    color: var(--primary-text);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    transition: var(--transition-fast);
}

.toolbar-btn:hover {
    background: var(--quaternary-bg);
}

.toolbar-btn-success {
    background: var(--accent-primary);
    color: white;
}

.toolbar-btn-success:hover {
    background: #2ea043;
}

.toolbar-btn-danger {
    background: var(--accent-danger);
    color: white;
}

.toolbar-btn-danger:hover {
    background: #f85149;
}

.control-btn.active {
    background: var(--accent-primary);
    color: white;
}
`;

// Inject visual editor styles
const visualStyleSheet = document.createElement('style');
visualStyleSheet.textContent = visualEditorStyles;
document.head.appendChild(visualStyleSheet);