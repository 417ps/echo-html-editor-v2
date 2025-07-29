// Fix for folder upload functionality
// This ensures proper integration between the main editor and folder processor

document.addEventListener('DOMContentLoaded', () => {
    // Wait for all modules to load
    setTimeout(() => {
        if (window.folderProcessor) {
            console.log('Folder processor loaded successfully');
            
            // Ensure the upload buttons are properly connected
            const uploadFilesBtn = document.getElementById('upload-files');
            const uploadFolderBtn = document.getElementById('upload-folder');
            
            if (uploadFilesBtn && uploadFolderBtn) {
                console.log('Upload buttons found and ready');
                
                // Add visual feedback
                uploadFilesBtn.addEventListener('mouseenter', () => {
                    uploadFilesBtn.style.transform = 'scale(1.05)';
                });
                uploadFilesBtn.addEventListener('mouseleave', () => {
                    uploadFilesBtn.style.transform = 'scale(1)';
                });
                
                uploadFolderBtn.addEventListener('mouseenter', () => {
                    uploadFolderBtn.style.transform = 'scale(1.05)';
                });
                uploadFolderBtn.addEventListener('mouseleave', () => {
                    uploadFolderBtn.style.transform = 'scale(1)';
                });
            } else {
                console.warn('Upload buttons not found - folder processor may not be initialized');
            }
            
            // Test folder upload capability
            if ('webkitdirectory' in document.createElement('input')) {
                console.log('✓ Browser supports folder upload');
            } else {
                console.warn('⚠ Browser does not support folder upload');
                if (window.editor) {
                    window.editor.showNotification('Your browser does not support folder upload. Please use individual file selection.', 'warning');
                }
            }
        } else {
            console.error('Folder processor not loaded - retrying...');
            // Retry after another second
            setTimeout(() => {
                if (!window.folderProcessor) {
                    console.error('Folder processor failed to load');
                    if (window.editor) {
                        window.editor.showNotification('Folder upload feature failed to load. Please refresh the page.', 'error');
                    }
                }
            }, 1000);
        }
    }, 1500); // Give extra time for all modules to initialize
});

// Enhanced debug information
window.debugFolderUpload = () => {
    console.log('=== Folder Upload Debug Info ===');
    console.log('Folder processor loaded:', !!window.folderProcessor);
    console.log('Upload files button:', !!document.getElementById('upload-files'));
    console.log('Upload folder button:', !!document.getElementById('upload-folder'));
    console.log('Dropzone element:', !!document.getElementById('upload-dropzone'));
    console.log('Browser supports webkitdirectory:', 'webkitdirectory' in document.createElement('input'));
    console.log('Main editor loaded:', !!window.editor);
    
    const dropzone = document.getElementById('upload-dropzone');
    if (dropzone) {
        console.log('Dropzone HTML:', dropzone.innerHTML.substring(0, 200) + '...');
    }
};

// Add global command for easy debugging
if (window.terminalInterface) {
    window.terminalInterface.commands.debug = () => {
        window.debugFolderUpload();
        window.terminalInterface.addOutput('', 'Debug information logged to console (F12)', 'success');
    };
}