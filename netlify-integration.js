// Enhanced Netlify Integration for Echo HTML Editor
// Based on official Netlify API documentation and best practices

class NetlifyIntegration {
    constructor(mainEditor) {
        this.mainEditor = mainEditor;
        this.apiBase = 'https://api.netlify.com/api/v1';
        this.token = null;
        this.currentSite = null;
        this.deploymentStatus = null;
        this.retryAttempts = 3;
        this.retryDelay = 2000;
        
        this.init();
    }

    init() {
        this.loadStoredCredentials();
        this.createNetlifyPanel();
        this.setupEventHandlers();
    }

    createNetlifyPanel() {
        // Add Netlify tab to navigation
        const nav = document.querySelector('.nav');
        const netlifyTab = document.createElement('button');
        netlifyTab.className = 'nav-btn';
        netlifyTab.dataset.tab = 'netlify';
        netlifyTab.innerHTML = `
            <i class="fas fa-cloud"></i>
            Netlify
        `;
        nav.appendChild(netlifyTab);

        // Create Netlify tab content
        const sidebar = document.querySelector('.sidebar');
        const netlifyTabContent = document.createElement('div');
        netlifyTabContent.className = 'tab-content';
        netlifyTabContent.id = 'netlify-tab';
        netlifyTabContent.innerHTML = `
            <div class="netlify-panel">
                <h4>
                    <i class="fas fa-cloud"></i>
                    Netlify Deployment
                </h4>
                
                <div class="connection-status" id="netlify-status">
                    <div class="status-indicator">
                        <i class="fas fa-circle status-disconnected"></i>
                        <span>Not Connected</span>
                    </div>
                </div>
                
                <div class="netlify-config" id="netlify-config">
                    <div class="config-section">
                        <label for="netlify-token">Personal Access Token:</label>
                        <input type="password" id="netlify-token" placeholder="netlify_access_token" />
                        <small>
                            <a href="https://app.netlify.com/user/applications/personal" target="_blank">
                                <i class="fas fa-external-link-alt"></i>
                                Generate token
                            </a>
                        </small>
                    </div>
                    
                    <div class="config-section">
                        <label for="site-name">Site Name (optional):</label>
                        <input type="text" id="site-name" placeholder="echo-html-editor" />
                        <small>Leave empty to auto-generate</small>
                    </div>
                    
                    <button class="btn-primary" id="connect-netlify">
                        <i class="fas fa-plug"></i>
                        Connect to Netlify
                    </button>
                </div>
                
                <div class="netlify-actions" id="netlify-actions" style="display: none;">
                    <div class="site-info" id="site-info">
                        <!-- Site information will be populated here -->
                    </div>
                    
                    <div class="deployment-controls">
                        <h5>Deployment Options</h5>
                        
                        <div class="deploy-methods">
                            <button class="deploy-method-btn active" data-method="zip">
                                <i class="fas fa-file-archive"></i>
                                <span>ZIP Upload</span>
                                <small>Fast, single file</small>
                            </button>
                            <button class="deploy-method-btn" data-method="files">
                                <i class="fas fa-files-o"></i>
                                <span>File Digest</span>
                                <small>Efficient, incremental</small>
                            </button>
                        </div>
                        
                        <button class="btn-primary deploy-btn" id="deploy-now">
                            <i class="fas fa-rocket"></i>
                            Deploy Now
                        </button>
                        
                        <label class="checkbox-label">
                            <input type="checkbox" id="auto-deploy" />
                            <span class="checkmark"></span>
                            Auto-deploy on save
                        </label>
                    </div>
                    
                    <div class="deployment-status" id="deployment-status" style="display: none;">
                        <h5>Deployment Status</h5>
                        <div class="status-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="progress-fill"></div>
                            </div>
                            <div class="status-text" id="status-text">Ready to deploy</div>
                        </div>
                    </div>
                    
                    <div class="deployment-history" id="netlify-deployment-history">
                        <h5>Recent Deployments</h5>
                        <div class="deployment-list" id="netlify-deployment-list">
                            <!-- Deployment history will be populated here -->
                        </div>
                    </div>
                    
                    <div class="site-actions">
                        <button class="btn-secondary" id="view-site">
                            <i class="fas fa-external-link-alt"></i>
                            View Live Site
                        </button>
                        <button class="btn-secondary" id="view-admin">
                            <i class="fas fa-cog"></i>
                            Netlify Admin
                        </button>
                        <button class="btn-danger" id="disconnect-netlify">
                            <i class="fas fa-unlink"></i>
                            Disconnect
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        sidebar.appendChild(netlifyTabContent);
    }

    setupEventHandlers() {
        document.getElementById('connect-netlify').addEventListener('click', () => {
            this.connectToNetlify();
        });

        document.getElementById('disconnect-netlify').addEventListener('click', () => {
            this.disconnect();
        });

        document.getElementById('deploy-now').addEventListener('click', () => {
            this.deployNow();
        });

        document.getElementById('view-site').addEventListener('click', () => {
            this.viewSite();
        });

        document.getElementById('view-admin').addEventListener('click', () => {
            this.viewAdmin();
        });

        document.getElementById('auto-deploy').addEventListener('change', (e) => {
            this.setAutoDeployEnabled(e.target.checked);
        });

        // Deploy method selection
        document.querySelectorAll('.deploy-method-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.deploy-method-btn').forEach(b => b.classList.remove('active'));
                e.target.closest('.deploy-method-btn').classList.add('active');
            });
        });

        // Override main editor save to include auto-deploy
        const originalSave = this.mainEditor.saveCurrentFile.bind(this.mainEditor);
        this.mainEditor.saveCurrentFile = () => {
            originalSave();
            if (this.currentSite && this.isAutoDeployEnabled()) {
                this.deployNow(true);
            }
        };
    }

    async connectToNetlify() {
        const token = document.getElementById('netlify-token').value.trim();
        const siteName = document.getElementById('site-name').value.trim();

        if (!token) {
            this.mainEditor.showNotification('Please enter your Netlify access token', 'error');
            return;
        }

        this.token = token;
        this.updateStatus('Connecting to Netlify...', 'connecting');

        try {
            // Test token by fetching user info
            const userResponse = await this.apiRequest('GET', '/user');
            if (!userResponse.ok) {
                throw new Error('Invalid access token');
            }

            const user = await userResponse.json();
            this.mainEditor.showNotification(`Connected as ${user.full_name || user.email}`, 'success');

            // Create or find site
            await this.createOrFindSite(siteName);
            
            this.saveCredentials();
            this.updateConnectionUI();
            this.loadDeploymentHistory();

        } catch (error) {
            this.updateStatus('Connection failed', 'error');
            this.mainEditor.showNotification(`Connection failed: ${error.message}`, 'error');
        }
    }

    async createOrFindSite(siteName) {
        try {
            // List existing sites first
            const sitesResponse = await this.apiRequest('GET', '/sites');
            const sites = await sitesResponse.json();
            
            // Look for existing site with matching name
            const existingSite = sites.find(site => 
                site.name === siteName || 
                site.name.includes('echo-html-editor')
            );

            if (existingSite) {
                this.currentSite = existingSite;
                this.updateStatus(`Connected to ${existingSite.name}`, 'connected');
                return;
            }

            // Create new site
            const createData = {
                name: siteName || `echo-html-editor-${Date.now()}`,
                processing_settings: {
                    html: {
                        pretty_urls: true
                    }
                }
            };

            const createResponse = await this.apiRequest('POST', '/sites', createData);
            
            if (!createResponse.ok) {
                const error = await createResponse.json();
                throw new Error(error.message || 'Failed to create site');
            }

            this.currentSite = await createResponse.json();
            this.updateStatus(`Created site: ${this.currentSite.name}`, 'connected');

        } catch (error) {
            throw new Error(`Site creation failed: ${error.message}`);
        }
    }

    async deployNow(isAutomatic = false) {
        if (!this.currentSite) {
            this.mainEditor.showNotification('Not connected to Netlify', 'error');
            return;
        }

        const deployType = isAutomatic ? 'Auto-deployment' : 'Manual deployment';
        this.updateDeploymentStatus('preparing', `${deployType} starting...`);

        try {
            const selectedMethod = document.querySelector('.deploy-method-btn.active').dataset.method;
            
            if (selectedMethod === 'zip') {
                await this.deployWithZip();
            } else {
                await this.deployWithFileDigest();
            }

        } catch (error) {
            this.updateDeploymentStatus('error', `Deployment failed: ${error.message}`);
            this.mainEditor.showNotification(`${deployType} failed: ${error.message}`, 'error');
        }
    }

    async deployWithZip() {
        this.updateDeploymentStatus('preparing', 'Creating ZIP archive...');
        
        const zipBlob = await this.createZipBlob();
        
        this.updateDeploymentStatus('uploading', 'Uploading to Netlify...');
        
        const deployResponse = await this.apiRequest(
            'POST', 
            `/sites/${this.currentSite.id}/deploys`,
            zipBlob,
            {
                'Content-Type': 'application/zip'
            }
        );

        if (!deployResponse.ok) {
            const error = await deployResponse.json();
            throw new Error(error.message || 'Deploy failed');
        }

        const deploy = await deployResponse.json();
        await this.pollDeploymentStatus(deploy.id);
    }

    async deployWithFileDigest() {
        this.updateDeploymentStatus('preparing', 'Analyzing files...');
        
        const files = await this.createFileDigest();
        
        this.updateDeploymentStatus('uploading', 'Creating deployment...');
        
        const deployData = {
            files: files,
            async: true
        };

        const deployResponse = await this.apiRequest(
            'POST',
            `/sites/${this.currentSite.id}/deploys`,
            deployData
        );

        if (!deployResponse.ok) {
            const error = await deployResponse.json();
            throw new Error(error.message || 'Deploy creation failed');
        }

        const deploy = await deployResponse.json();
        
        // Upload any required files
        await this.uploadRequiredFiles(deploy);
        
        // Poll for completion
        await this.pollDeploymentStatus(deploy.id);
    }

    async createZipBlob() {
        // Use JSZip library if available, otherwise create a simple archive
        if (typeof JSZip !== 'undefined') {
            const zip = new JSZip();
            
            // Add all editor files
            const files = this.getEditorFiles();
            for (const [path, content] of Object.entries(files)) {
                zip.file(path, content);
            }
            
            return await zip.generateAsync({ type: 'blob' });
        } else {
            // Fallback: create a simple form data approach
            return this.createSimpleArchive();
        }
    }

    async createFileDigest() {
        const files = this.getEditorFiles();
        const digest = {};
        
        for (const [path, content] of Object.entries(files)) {
            // Create SHA1 hash of content
            const hash = await this.sha1(content);
            digest[path] = hash;
        }
        
        return digest;
    }

    getEditorFiles() {
        const files = {};
        
        // Get current file content
        if (this.mainEditor.currentFile) {
            const fileData = this.mainEditor.openFiles.get(this.mainEditor.currentFile);
            if (fileData) {
                files[fileData.name] = this.mainEditor.editor.getValue();
            }
        } else {
            // Use default content if no file is open
            files['index.html'] = this.mainEditor.editor.getValue();
        }
        
        // Add any additional project files if available
        if (window.folderProcessor && window.folderProcessor.projectFiles) {
            for (const [path, fileData] of window.folderProcessor.projectFiles) {
                if (fileData.content && fileData.type !== 'binary') {
                    files[path] = fileData.content;
                }
            }
        }
        
        return files;
    }

    async uploadRequiredFiles(deploy) {
        if (!deploy.required || deploy.required.length === 0) {
            return;
        }

        this.updateDeploymentStatus('uploading', `Uploading ${deploy.required.length} files...`);
        
        const files = this.getEditorFiles();
        
        for (const filePath of deploy.required) {
            if (files[filePath]) {
                const uploadResponse = await this.apiRequest(
                    'PUT',
                    `/deploys/${deploy.id}/files/${encodeURIComponent(filePath)}`,
                    files[filePath],
                    {
                        'Content-Type': 'application/octet-stream'
                    }
                );
                
                if (!uploadResponse.ok) {
                    throw new Error(`Failed to upload ${filePath}`);
                }
            }
        }
    }

    async pollDeploymentStatus(deployId) {
        const maxPolls = 60; // 5 minutes max
        let polls = 0;
        
        while (polls < maxPolls) {
            try {
                const deployResponse = await this.apiRequest('GET', `/deploys/${deployId}`);
                const deploy = await deployResponse.json();
                
                this.updateDeploymentStatus(deploy.state, this.getStatusMessage(deploy.state));
                
                if (deploy.state === 'ready') {
                    this.deploymentComplete(deploy);
                    return;
                } else if (deploy.state === 'error') {
                    throw new Error('Deployment failed');
                }
                
                await this.delay(5000); // Poll every 5 seconds
                polls++;
                
            } catch (error) {
                throw new Error(`Polling failed: ${error.message}`);
            }
        }
        
        throw new Error('Deployment timeout');
    }

    deploymentComplete(deploy) {
        this.updateDeploymentStatus('ready', 'Deployment successful!');
        this.mainEditor.showNotification('Site deployed successfully!', 'success');
        
        // Add to deployment history
        this.addToDeploymentHistory({
            id: deploy.id,
            url: deploy.deploy_ssl_url || deploy.ssl_url,
            state: deploy.state,
            created_at: deploy.created_at,
            commit_ref: deploy.commit_ref
        });
        
        // Update site info
        this.updateSiteInfo();
    }

    updateDeploymentStatus(state, message) {
        const statusElement = document.getElementById('deployment-status');
        const progressFill = document.getElementById('progress-fill');
        const statusText = document.getElementById('status-text');
        
        statusElement.style.display = 'block';
        statusText.textContent = message;
        
        const progressMap = {
            preparing: 20,
            uploading: 60,
            processing: 80,
            ready: 100,
            error: 0
        };
        
        const progress = progressMap[state] || 0;
        progressFill.style.width = `${progress}%`;
        
        if (state === 'ready') {
            progressFill.style.backgroundColor = 'var(--accent-primary)';
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        } else if (state === 'error') {
            progressFill.style.backgroundColor = 'var(--accent-danger)';
        }
    }

    getStatusMessage(state) {
        const messages = {
            preparing: 'Preparing deployment...',
            uploading: 'Uploading files...',
            processing: 'Processing deployment...',
            building: 'Building site...',
            ready: 'Deployment complete!',
            error: 'Deployment failed'
        };
        
        return messages[state] || `Status: ${state}`;
    }

    async apiRequest(method, endpoint, data = null, customHeaders = {}) {
        const url = `${this.apiBase}${endpoint}`;
        
        const headers = {
            'Authorization': `Bearer ${this.token}`,
            ...customHeaders
        };
        
        if (data && !customHeaders['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        
        const config = {
            method,
            headers
        };
        
        if (data) {
            if (data instanceof Blob) {
                config.body = data;
            } else if (typeof data === 'string') {
                config.body = data;
            } else {
                config.body = JSON.stringify(data);
            }
        }
        
        // Retry logic
        for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
            try {
                const response = await fetch(url, config);
                
                if (response.status === 429) { // Rate limited
                    await this.delay(this.retryDelay * (attempt + 1));
                    continue;
                }
                
                return response;
                
            } catch (error) {
                if (attempt === this.retryAttempts - 1) {
                    throw error;
                }
                await this.delay(this.retryDelay);
            }
        }
    }

    updateConnectionUI() {
        const statusElement = document.getElementById('netlify-status');
        const configElement = document.getElementById('netlify-config');
        const actionsElement = document.getElementById('netlify-actions');

        if (this.currentSite) {
            statusElement.innerHTML = `
                <div class="status-indicator">
                    <i class="fas fa-circle status-connected"></i>
                    <span>Connected to ${this.currentSite.name}</span>
                </div>
            `;
            configElement.style.display = 'none';
            actionsElement.style.display = 'block';
            
            this.updateSiteInfo();
        } else {
            statusElement.innerHTML = `
                <div class="status-indicator">
                    <i class="fas fa-circle status-disconnected"></i>
                    <span>Not Connected</span>
                </div>
            `;
            configElement.style.display = 'block';
            actionsElement.style.display = 'none';
        }
    }

    updateSiteInfo() {
        if (!this.currentSite) return;
        
        const siteInfoElement = document.getElementById('site-info');
        siteInfoElement.innerHTML = `
            <div class="site-card">
                <div class="site-details">
                    <h6>${this.currentSite.name}</h6>
                    <div class="site-url">
                        <a href="${this.currentSite.ssl_url || this.currentSite.url}" target="_blank">
                            ${this.currentSite.ssl_url || this.currentSite.url}
                        </a>
                    </div>
                </div>
                <div class="site-status">
                    <span class="status-badge ${this.currentSite.published_deploy ? 'active' : 'inactive'}">
                        ${this.currentSite.published_deploy ? 'Live' : 'Not Published'}
                    </span>
                </div>
            </div>
        `;
    }

    updateStatus(message, type) {
        // Implementation for updating connection status
        console.log(`Netlify ${type}: ${message}`);
    }

    viewSite() {
        if (this.currentSite) {
            window.open(this.currentSite.ssl_url || this.currentSite.url, '_blank');
        }
    }

    viewAdmin() {
        if (this.currentSite) {
            window.open(`https://app.netlify.com/sites/${this.currentSite.name}`, '_blank');
        }
    }

    disconnect() {
        if (confirm('Are you sure you want to disconnect from Netlify?')) {
            this.token = null;
            this.currentSite = null;
            this.clearStoredCredentials();
            this.updateConnectionUI();
            this.mainEditor.showNotification('Disconnected from Netlify', 'info');
        }
    }

    // Utility methods
    async sha1(content) {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    createSimpleArchive() {
        // Fallback implementation without JSZip
        const formData = new FormData();
        const files = this.getEditorFiles();
        
        for (const [path, content] of Object.entries(files)) {
            const blob = new Blob([content], { type: 'text/plain' });
            formData.append(path, blob, path);
        }
        
        return formData;
    }

    // Storage methods
    saveCredentials() {
        const credentials = {
            token: this.token,
            siteId: this.currentSite?.id,
            siteName: this.currentSite?.name
        };
        localStorage.setItem('echo-netlify-credentials', JSON.stringify(credentials));
    }

    loadStoredCredentials() {
        try {
            const stored = localStorage.getItem('echo-netlify-credentials');
            if (stored) {
                const credentials = JSON.parse(stored);
                this.token = credentials.token;
                
                if (credentials.siteId) {
                    // Restore site info (will be validated on first API call)
                    this.currentSite = {
                        id: credentials.siteId,
                        name: credentials.siteName
                    };
                    this.updateConnectionUI();
                }
            }
        } catch (error) {
            console.warn('Failed to load stored Netlify credentials:', error);
        }
    }

    clearStoredCredentials() {
        localStorage.removeItem('echo-netlify-credentials');
        localStorage.removeItem('echo-netlify-auto-deploy');
        localStorage.removeItem('echo-netlify-deployment-history');
    }

    isAutoDeployEnabled() {
        return localStorage.getItem('echo-netlify-auto-deploy') === 'true';
    }

    setAutoDeployEnabled(enabled) {
        localStorage.setItem('echo-netlify-auto-deploy', enabled.toString());
        document.getElementById('auto-deploy').checked = enabled;
        
        const message = enabled 
            ? 'Auto-deployment enabled - files will deploy automatically on save'
            : 'Auto-deployment disabled';
        this.mainEditor.showNotification(message, 'info');
    }

    addToDeploymentHistory(deployment) {
        let history = this.getDeploymentHistory();
        history.unshift({
            ...deployment,
            timestamp: new Date().toISOString(),
            type: 'netlify'
        });
        
        // Keep only last 10 deployments
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        
        localStorage.setItem('echo-netlify-deployment-history', JSON.stringify(history));
        this.updateDeploymentHistoryUI();
    }

    getDeploymentHistory() {
        try {
            const stored = localStorage.getItem('echo-netlify-deployment-history');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    loadDeploymentHistory() {
        const autoDeployEnabled = this.isAutoDeployEnabled();
        document.getElementById('auto-deploy').checked = autoDeployEnabled;
        this.updateDeploymentHistoryUI();
    }

    updateDeploymentHistoryUI() {
        const historyElement = document.getElementById('netlify-deployment-list');
        const history = this.getDeploymentHistory();
        
        if (history.length === 0) {
            historyElement.innerHTML = '<small class="no-deployments">No deployments yet</small>';
            return;
        }
        
        historyElement.innerHTML = history.map(deployment => `
            <div class="deployment-item ${deployment.state || 'success'}">
                <div class="deployment-info">
                    <div class="deployment-url">
                        <a href="${deployment.url}" target="_blank">
                            ${deployment.url ? new URL(deployment.url).hostname : 'Deployed'}
                        </a>
                    </div>
                    <div class="deployment-meta">
                        <span class="deployment-time">${this.formatTime(deployment.timestamp)}</span>
                        <span class="deployment-id">${deployment.id?.substring(0, 8)}</span>
                    </div>
                </div>
                <div class="deployment-status">
                    <i class="fas fa-${deployment.state === 'ready' ? 'check' : 'clock'}"></i>
                </div>
            </div>
        `).join('');
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }
}

// Add Netlify integration styles
const netlifyStyles = `
.netlify-panel {
    color: var(--primary-text);
}

.site-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: var(--tertiary-bg);
    border-radius: 6px;
    border: 1px solid var(--border-default);
    margin-bottom: 1.5rem;
}

.site-details h6 {
    margin: 0 0 0.25rem 0;
    color: var(--primary-text);
    font-size: 0.9rem;
    font-weight: 600;
}

.site-url a {
    color: var(--accent-secondary);
    text-decoration: none;
    font-size: 0.8rem;
}

.site-url a:hover {
    text-decoration: underline;
}

.status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
}

.status-badge.active {
    background: var(--accent-primary);
    color: white;
}

.status-badge.inactive {
    background: var(--quaternary-bg);
    color: var(--secondary-text);
}

.deploy-methods {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.deploy-method-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem;
    background: var(--tertiary-bg);
    border: 1px solid var(--border-default);
    border-radius: 6px;
    cursor: pointer;
    transition: var(--transition-fast);
    text-align: center;
}

.deploy-method-btn:hover {
    background: var(--quaternary-bg);
    border-color: var(--accent-primary);
}

.deploy-method-btn.active {
    background: rgba(35, 134, 54, 0.1);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
}

.deploy-method-btn i {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
}

.deploy-method-btn span {
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
    color: var(--primary-text);
}

.deploy-method-btn small {
    font-size: 0.75rem;
    color: var(--secondary-text);
}

.deployment-status {
    margin: 1rem 0;
    padding: 1rem;
    background: var(--tertiary-bg);
    border-radius: 6px;
    border: 1px solid var(--border-default);
}

.status-progress {
    margin-bottom: 0.5rem;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: var(--quaternary-bg);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
}

.progress-fill {
    height: 100%;
    background: var(--accent-secondary);
    transition: width 0.3s ease;
    border-radius: 4px;
}

.status-text {
    font-size: 0.875rem;
    color: var(--primary-text);
    text-align: center;
}

.deployment-list .deployment-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: var(--tertiary-bg);
    border-radius: 4px;
    margin-bottom: 0.5rem;
    border-left: 3px solid var(--border-default);
}

.deployment-list .deployment-item.ready {
    border-left-color: var(--accent-primary);
}

.deployment-url a {
    color: var(--primary-text);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
}

.deployment-url a:hover {
    color: var(--accent-secondary);
}

.deployment-meta {
    display: flex;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--secondary-text);
    margin-top: 0.25rem;
}

.deployment-id {
    background: var(--quaternary-bg);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: var(--font-mono);
}

.site-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
}

.site-actions button {
    width: 100%;
}
`;

// Inject Netlify styles
const netlifyStyleSheet = document.createElement('style');
netlifyStyleSheet.textContent = netlifyStyles;
document.head.appendChild(netlifyStyleSheet);