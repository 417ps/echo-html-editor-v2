// Echo GitHub Integration - Auto-deployment functionality

class GitHubIntegration {
    constructor(mainEditor) {
        this.mainEditor = mainEditor;
        this.githubToken = null;
        this.repoOwner = null;
        this.repoName = null;
        this.branch = 'main';
        this.filePath = '';
        this.isConnected = false;
        
        this.init();
    }

    init() {
        this.createGitHubPanel();
        this.loadStoredCredentials();
    }

    createGitHubPanel() {
        // Add GitHub tab to navigation
        const nav = document.querySelector('.nav');
        const githubTab = document.createElement('button');
        githubTab.className = 'nav-btn';
        githubTab.dataset.tab = 'github';
        githubTab.innerHTML = `
            <i class="fab fa-github"></i>
            GitHub
        `;
        nav.appendChild(githubTab);

        // Create GitHub tab content
        const sidebar = document.querySelector('.sidebar');
        const githubTabContent = document.createElement('div');
        githubTabContent.className = 'tab-content';
        githubTabContent.id = 'github-tab';
        githubTabContent.innerHTML = `
            <div class="github-panel">
                <h4>
                    <i class="fab fa-github"></i>
                    GitHub Integration
                </h4>
                
                <div class="connection-status" id="github-status">
                    <div class="status-indicator">
                        <i class="fas fa-circle status-disconnected"></i>
                        <span>Not Connected</span>
                    </div>
                </div>
                
                <div class="github-config" id="github-config">
                    <div class="config-section">
                        <label for="github-token">Personal Access Token:</label>
                        <input type="password" id="github-token" placeholder="ghp_xxxxxxxxxxxx" />
                        <small>
                            <a href="https://github.com/settings/tokens" target="_blank">
                                <i class="fas fa-external-link-alt"></i>
                                Generate token
                            </a>
                        </small>
                    </div>
                    
                    <div class="config-section">
                        <label for="repo-owner">Repository Owner:</label>
                        <input type="text" id="repo-owner" placeholder="username or org" />
                    </div>
                    
                    <div class="config-section">
                        <label for="repo-name">Repository Name:</label>
                        <input type="text" id="repo-name" placeholder="my-website" />
                    </div>
                    
                    <div class="config-section">
                        <label for="branch-name">Branch:</label>
                        <input type="text" id="branch-name" value="main" />
                    </div>
                    
                    <div class="config-section">
                        <label for="file-path">File Path in Repo:</label>
                        <input type="text" id="file-path" placeholder="index.html or docs/page.html" />
                    </div>
                    
                    <button class="btn-primary" id="connect-github">
                        <i class="fas fa-plug"></i>
                        Connect to GitHub
                    </button>
                </div>
                
                <div class="github-actions" id="github-actions" style="display: none;">
                    <div class="action-section">
                        <h5>Auto-Deploy Settings</h5>
                        <label class="checkbox-label">
                            <input type="checkbox" id="auto-deploy" />
                            <span class="checkmark"></span>
                            Auto-deploy on save
                        </label>
                        <small>Automatically commit and push changes when you save</small>
                    </div>
                    
                    <div class="action-section">
                        <h5>Manual Actions</h5>
                        <button class="btn-secondary deploy-btn" id="deploy-now">
                            <i class="fas fa-rocket"></i>
                            Deploy Now
                        </button>
                        <button class="btn-secondary deploy-btn" id="view-repo">
                            <i class="fas fa-external-link-alt"></i>
                            View Repository
                        </button>
                    </div>
                    
                    <div class="action-section">
                        <h5>Recent Deployments</h5>
                        <div class="deployment-history" id="deployment-history">
                            <!-- Deployment history will be populated here -->
                        </div>
                    </div>
                    
                    <button class="btn-danger" id="disconnect-github">
                        <i class="fas fa-unlink"></i>
                        Disconnect
                    </button>
                </div>
            </div>
        `;
        
        sidebar.appendChild(githubTabContent);
        this.setupGitHubEvents();
    }

    setupGitHubEvents() {
        document.getElementById('connect-github').addEventListener('click', () => {
            this.connectToGitHub();
        });

        document.getElementById('disconnect-github').addEventListener('click', () => {
            this.disconnectFromGitHub();
        });

        document.getElementById('deploy-now').addEventListener('click', () => {
            this.deployNow();
        });

        document.getElementById('view-repo').addEventListener('click', () => {
            this.viewRepository();
        });

        document.getElementById('auto-deploy').addEventListener('change', (e) => {
            this.setAutoDeployEnabled(e.target.checked);
        });

        // Override main editor save to include GitHub deployment
        const originalSave = this.mainEditor.saveCurrentFile.bind(this.mainEditor);
        this.mainEditor.saveCurrentFile = () => {
            originalSave();
            if (this.isConnected && this.isAutoDeployEnabled()) {
                this.deployNow(true);
            }
        };
    }

    async connectToGitHub() {
        const token = document.getElementById('github-token').value.trim();
        const owner = document.getElementById('repo-owner').value.trim();
        const repo = document.getElementById('repo-name').value.trim();
        const branch = document.getElementById('branch-name').value.trim() || 'main';
        const filePath = document.getElementById('file-path').value.trim();

        if (!token || !owner || !repo || !filePath) {
            this.mainEditor.showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            // Test GitHub connection
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
            }

            // Store credentials
            this.githubToken = token;
            this.repoOwner = owner;
            this.repoName = repo;
            this.branch = branch;
            this.filePath = filePath;
            this.isConnected = true;

            this.saveCredentials();
            this.updateConnectionStatus();
            this.loadDeploymentHistory();

            this.mainEditor.showNotification('Successfully connected to GitHub!', 'success');

        } catch (error) {
            this.mainEditor.showNotification(`Connection failed: ${error.message}`, 'error');
        }
    }

    disconnectFromGitHub() {
        if (confirm('Are you sure you want to disconnect from GitHub?')) {
            this.githubToken = null;
            this.repoOwner = null;
            this.repoName = null;
            this.branch = 'main';
            this.filePath = '';
            this.isConnected = false;
            
            this.clearStoredCredentials();
            this.updateConnectionStatus();
            
            this.mainEditor.showNotification('Disconnected from GitHub', 'info');
        }
    }

    async deployNow(isAutomatic = false) {
        if (!this.isConnected) {
            this.mainEditor.showNotification('Not connected to GitHub', 'error');
            return;
        }

        if (!this.mainEditor.currentFile) {
            this.mainEditor.showNotification('No file to deploy', 'warning');
            return;
        }

        const deployType = isAutomatic ? 'Auto-deployment' : 'Manual deployment';
        this.mainEditor.showNotification(`${deployType} starting...`, 'info');

        try {
            const content = this.mainEditor.editor.getValue();
            const fileData = this.mainEditor.openFiles.get(this.mainEditor.currentFile);
            
            await this.updateFileInRepo(content, fileData.name, isAutomatic);
            
            this.addToDeploymentHistory({
                timestamp: new Date(),
                fileName: fileData.name,
                type: isAutomatic ? 'automatic' : 'manual',
                status: 'success'
            });

            this.mainEditor.showNotification(`${deployType} successful!`, 'success');

        } catch (error) {
            this.addToDeploymentHistory({
                timestamp: new Date(),
                fileName: fileData ? fileData.name : 'unknown',
                type: isAutomatic ? 'automatic' : 'manual',
                status: 'failed',
                error: error.message
            });

            this.mainEditor.showNotification(`${deployType} failed: ${error.message}`, 'error');
        }
    }

    async updateFileInRepo(content, fileName, isAutomatic) {
        try {
            // First, try to get the current file to get its SHA
            let sha = null;
            try {
                const fileResponse = await fetch(
                    `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.filePath}`,
                    {
                        headers: {
                            'Authorization': `token ${this.githubToken}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                
                if (fileResponse.ok) {
                    const fileData = await fileResponse.json();
                    sha = fileData.sha;
                }
            } catch (error) {
                // File might not exist yet, which is fine
            }

            // Create or update the file
            const commitMessage = isAutomatic 
                ? `Auto-update ${fileName} via Echo Editor`
                : `Update ${fileName} via Echo Editor`;

            const updateResponse = await fetch(
                `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.filePath}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: commitMessage,
                        content: btoa(unescape(encodeURIComponent(content))), // Base64 encode with UTF-8 support
                        branch: this.branch,
                        ...(sha && { sha }) // Include SHA if file exists
                    })
                }
            );

            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                throw new Error(errorData.message || `HTTP ${updateResponse.status}`);
            }

            return await updateResponse.json();

        } catch (error) {
            throw new Error(`Failed to update repository: ${error.message}`);
        }
    }

    viewRepository() {
        if (this.isConnected) {
            const repoUrl = `https://github.com/${this.repoOwner}/${this.repoName}`;
            window.open(repoUrl, '_blank');
        }
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('github-status');
        const configElement = document.getElementById('github-config');
        const actionsElement = document.getElementById('github-actions');

        if (this.isConnected) {
            statusElement.innerHTML = `
                <div class="status-indicator">
                    <i class="fas fa-circle status-connected"></i>
                    <span>Connected to ${this.repoOwner}/${this.repoName}</span>
                </div>
                <div class="connection-details">
                    <small>Branch: ${this.branch} | Path: ${this.filePath}</small>
                </div>
            `;
            configElement.style.display = 'none';
            actionsElement.style.display = 'block';
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

    saveCredentials() {
        const credentials = {
            githubToken: this.githubToken,
            repoOwner: this.repoOwner,
            repoName: this.repoName,
            branch: this.branch,
            filePath: this.filePath
        };
        localStorage.setItem('echo-github-credentials', JSON.stringify(credentials));
    }

    loadStoredCredentials() {
        try {
            const stored = localStorage.getItem('echo-github-credentials');
            if (stored) {
                const credentials = JSON.parse(stored);
                this.githubToken = credentials.githubToken;
                this.repoOwner = credentials.repoOwner;
                this.repoName = credentials.repoName;
                this.branch = credentials.branch || 'main';
                this.filePath = credentials.filePath;
                
                if (this.githubToken && this.repoOwner && this.repoName && this.filePath) {
                    this.isConnected = true;
                    this.updateConnectionStatus();
                    this.loadDeploymentHistory();
                }
            }
        } catch (error) {
            console.warn('Failed to load stored GitHub credentials:', error);
        }
    }

    clearStoredCredentials() {
        localStorage.removeItem('echo-github-credentials');
        localStorage.removeItem('echo-github-auto-deploy');
        localStorage.removeItem('echo-deployment-history');
    }

    isAutoDeployEnabled() {
        return localStorage.getItem('echo-github-auto-deploy') === 'true';
    }

    setAutoDeployEnabled(enabled) {
        localStorage.setItem('echo-github-auto-deploy', enabled.toString());
        document.getElementById('auto-deploy').checked = enabled;
        
        const message = enabled 
            ? 'Auto-deployment enabled - files will deploy automatically on save'
            : 'Auto-deployment disabled';
        this.mainEditor.showNotification(message, 'info');
    }

    addToDeploymentHistory(deployment) {
        let history = this.getDeploymentHistory();
        history.unshift(deployment);
        
        // Keep only last 10 deployments
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        
        localStorage.setItem('echo-deployment-history', JSON.stringify(history));
        this.updateDeploymentHistoryUI();
    }

    getDeploymentHistory() {
        try {
            const stored = localStorage.getItem('echo-deployment-history');
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
        const historyElement = document.getElementById('deployment-history');
        const history = this.getDeploymentHistory();
        
        if (history.length === 0) {
            historyElement.innerHTML = '<small class="no-deployments">No deployments yet</small>';
            return;
        }
        
        historyElement.innerHTML = history.map(deployment => `
            <div class="deployment-item ${deployment.status}">
                <div class="deployment-info">
                    <div class="deployment-file">${deployment.fileName}</div>
                    <div class="deployment-meta">
                        <span class="deployment-type">${deployment.type}</span>
                        <span class="deployment-time">${this.formatTime(deployment.timestamp)}</span>
                    </div>
                </div>
                <div class="deployment-status">
                    <i class="fas fa-${deployment.status === 'success' ? 'check' : 'times'}"></i>
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

// Add GitHub integration styles
const githubStyles = `
.github-panel {
    color: var(--primary-text);
}

.connection-status {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--tertiary-bg);
    border-radius: 6px;
    border: 1px solid var(--border-default);
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.status-connected {
    color: var(--accent-primary);
    font-size: 0.5rem;
}

.status-disconnected {
    color: var(--secondary-text);
    font-size: 0.5rem;
}

.connection-details {
    color: var(--secondary-text);
    font-size: 0.8rem;
}

.config-section,
.action-section {
    margin-bottom: 1rem;
}

.config-section label,
.action-section h5 {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--primary-text);
    font-size: 0.875rem;
    font-weight: 500;
}

.config-section input {
    width: 100%;
    padding: 0.5rem;
    background: var(--tertiary-bg);
    border: 1px solid var(--border-default);
    border-radius: 4px;
    color: var(--primary-text);
    font-size: 0.875rem;
}

.config-section input:focus {
    outline: none;
    border-color: var(--accent-primary);
}

.config-section small {
    display: block;
    margin-top: 0.25rem;
    color: var(--secondary-text);
    font-size: 0.75rem;
}

.config-section small a {
    color: var(--accent-secondary);
    text-decoration: none;
}

.config-section small a:hover {
    text-decoration: underline;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    margin-bottom: 0.5rem;
}

.checkbox-label input[type="checkbox"] {
    width: auto;
    margin: 0;
}

.deploy-btn {
    width: 100%;
    margin-bottom: 0.5rem;
}

.deployment-history {
    max-height: 200px;
    overflow-y: auto;
}

.deployment-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    background: var(--tertiary-bg);
    border-radius: 4px;
    margin-bottom: 0.5rem;
    border-left: 3px solid var(--border-default);
}

.deployment-item.success {
    border-left-color: var(--accent-primary);
}

.deployment-item.failed {
    border-left-color: var(--accent-danger);
}

.deployment-info {
    flex: 1;
    min-width: 0;
}

.deployment-file {
    font-size: 0.875rem;
    color: var(--primary-text);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.deployment-meta {
    display: flex;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--secondary-text);
    margin-top: 0.25rem;
}

.deployment-type {
    background: var(--quaternary-bg);
    padding: 2px 6px;
    border-radius: 3px;
    text-transform: capitalize;
}

.deployment-status i {
    font-size: 1rem;
}

.deployment-item.success .deployment-status i {
    color: var(--accent-primary);
}

.deployment-item.failed .deployment-status i {
    color: var(--accent-danger);
}

.no-deployments {
    display: block;
    text-align: center;
    color: var(--secondary-text);
    font-style: italic;
    padding: 1rem;
}
`;

// Inject GitHub styles
const githubStyleSheet = document.createElement('style');
githubStyleSheet.textContent = githubStyles;
document.head.appendChild(githubStyleSheet);