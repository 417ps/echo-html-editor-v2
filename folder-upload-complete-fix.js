// Complete Fix for Folder Upload Display Issues

// Override the handleFileSelection method to ensure proper display
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.folderProcessor) {
            console.log('Applying folder upload display fixes...');
            
            // Store original method
            const originalHandleFileSelection = window.folderProcessor.handleFileSelection.bind(window.folderProcessor);
            
            // Enhanced version with better logging and UI updates
            window.folderProcessor.handleFileSelection = async function(files, isFolder = false) {
                console.log(`Processing ${files.length} files (folder: ${isFolder})`);
                
                if (files.length === 0) {
                    console.warn('No files to process');
                    return;
                }
                
                try {
                    if (isFolder) {
                        console.log('Processing as folder...');
                        await this.processFolder(files);
                    } else {
                        console.log('Processing as individual files...');
                        for (let file of files) {
                            if (this.isValidFile(file)) {
                                await this.loadFile(file);
                            } else {
                                console.warn(`Skipping invalid file: ${file.name}`);
                            }
                        }
                    }
                    
                    // Force UI update
                    console.log('Forcing UI update...');
                    this.updateFileTree();
                    
                    // Show success notification
                    this.mainEditor.showNotification(`Successfully loaded ${files.length} files`, 'success');
                    
                    // Force switch to Files tab
                    setTimeout(() => {
                        this.mainEditor.switchTab('files');
                        console.log('Switched to Files tab');
                    }, 100);
                    
                } catch (error) {
                    console.error('Error processing files:', error);
                    this.mainEditor.showNotification(`Error processing files: ${error.message}`, 'error');
                }
            };
            
            // Enhanced updateFileTree method
            const originalUpdateFileTree = window.folderProcessor.updateFileTree.bind(window.folderProcessor);
            window.folderProcessor.updateFileTree = function() {
                console.log('Updating file tree...');
                console.log('Current project:', this.currentProject);
                console.log('Project files count:', this.projectFiles.size);
                
                const fileTree = document.getElementById('file-tree');
                const projectName = document.getElementById('project-name');
                
                if (!fileTree) {
                    console.error('File tree element not found!');
                    return;
                }
                
                if (!projectName) {
                    console.error('Project name element not found!');
                    return;
                }
                
                if (!this.currentProject || this.projectFiles.size === 0) {
                    console.log('No project or files to display');
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
                
                console.log(`Rendering file tree for project: ${this.currentProject.name}`);
                projectName.textContent = this.currentProject.name;
                
                const treeHTML = this.renderFileTree(this.currentProject.structure);
                console.log('Generated tree HTML length:', treeHTML.length);
                fileTree.innerHTML = treeHTML;
                
                console.log('File tree updated successfully');
            };
            
            // Enhanced processFolder method with better error handling
            const originalProcessFolder = window.folderProcessor.processFolder.bind(window.folderProcessor);
            window.folderProcessor.processFolder = async function(files) {
                console.log(`Processing folder with ${files.length} files`);
                
                try {
                    // Determine project name from first file path
                    const firstFile = files[0];
                    const projectName = this.extractProjectName(firstFile);
                    console.log(`Project name: ${projectName}`);
                    
                    this.currentProject = {
                        name: projectName,
                        files: new Map(),
                        structure: {}
                    };
                    
                    // Clear existing files if this is a new project
                    this.projectFiles.clear();
                    this.mainEditor.openFiles.clear();
                    
                    // Process all files with progress logging
                    let processedCount = 0;
                    for (let file of files) {
                        await this.loadProjectFile(file);
                        processedCount++;
                        
                        if (processedCount % 10 === 0) {
                            console.log(`Processed ${processedCount}/${files.length} files`);
                        }
                    }
                    
                    console.log(`Finished processing ${processedCount} files`);
                    console.log(`Project files map size: ${this.projectFiles.size}`);
                    
                    // Build file tree structure
                    this.buildProjectStructure();
                    console.log('Built project structure:', this.currentProject.structure);
                    
                    // Force UI update
                    this.updateFileTree();
                    
                    // Switch to Files tab to show the project
                    this.mainEditor.switchTab('files');
                    
                } catch (error) {
                    console.error('Error in processFolder:', error);
                    throw error;
                }
            };
            
            // Add debugging method to window
            window.debugFolderState = () => {
                const fp = window.folderProcessor;
                console.log('=== FOLDER PROCESSOR DEBUG ===');
                console.log('Current project:', fp.currentProject);
                console.log('Project files size:', fp.projectFiles.size);
                console.log('Project files:', [...fp.projectFiles.keys()]);
                console.log('Main editor open files:', fp.mainEditor.openFiles.size);
                console.log('File tree element:', document.getElementById('file-tree'));
                console.log('Project name element:', document.getElementById('project-name'));
                
                if (fp.currentProject && fp.currentProject.structure) {
                    console.log('Project structure:', fp.currentProject.structure);
                }
            };
            
            console.log('Folder upload fixes applied successfully');
            
        } else {
            console.error('Folder processor not found - cannot apply fixes');
        }
    }, 2000); // Give extra time for initialization
});

// Add enhanced styles for better visual feedback
const enhancedStyles = `
.no-project {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--secondary-text);
    animation: fadeIn 0.3s ease;
}

.no-project i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: var(--muted-text);
    opacity: 0.5;
}

.tree-item {
    animation: slideIn 0.2s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideIn {
    from { 
        opacity: 0; 
        transform: translateX(-10px); 
    }
    to { 
        opacity: 1; 
        transform: translateX(0); 
    }
}

.file-tree {
    position: relative;
}

.file-tree.loading::before {
    content: 'Loading files...';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--secondary-text);
    font-style: italic;
}
`;

// Inject enhanced styles
const enhancedStyleSheet = document.createElement('style');
enhancedStyleSheet.textContent = enhancedStyles;
document.head.appendChild(enhancedStyleSheet);

// Add terminal command for debugging
setTimeout(() => {
    if (window.terminalInterface) {
        window.terminalInterface.commands.folder = (args) => {
            if (args[0] === 'debug') {
                window.debugFolderState();
                window.terminalInterface.addOutput('', 'Folder state logged to console (F12)', 'success');
            } else if (args[0] === 'test') {
                // Test if folder processor is working
                const fp = window.folderProcessor;
                if (fp) {
                    window.terminalInterface.addOutput('', '✓ Folder processor loaded', 'success');
                    window.terminalInterface.addOutput('', `✓ Project files: ${fp.projectFiles.size}`, 'success');
                    window.terminalInterface.addOutput('', `✓ Current project: ${fp.currentProject?.name || 'None'}`, fp.currentProject ? 'success' : 'error');
                } else {
                    window.terminalInterface.addOutput('', '✗ Folder processor not loaded', 'error');
                }
            } else {
                window.terminalInterface.addOutput('', 'Usage: folder [debug|test]', 'error');
            }
        };
    }
}, 3000);