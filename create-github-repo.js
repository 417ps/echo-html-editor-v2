// Create GitHub Repository via API
const fs = require('fs');
const path = require('path');

async function createGitHubRepo() {
    const repoName = 'echo-html-editor';
    const description = 'Professional web-based HTML editor with visual editing, folder support, GitHub integration, and resizable panels';
    
    // You'll need to set your GitHub token as an environment variable
    const token = process.env.GITHUB_TOKEN || 'your_github_token_here';
    
    if (token === 'your_github_token_here') {
        console.log('❌ Please set your GITHUB_TOKEN environment variable');
        console.log('   export GITHUB_TOKEN=your_token_here');
        console.log('   Generate token at: https://github.com/settings/tokens');
        return;
    }
    
    try {
        console.log('🚀 Creating GitHub repository...');
        
        // Create repository
        const createResponse = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: repoName,
                description: description,
                private: false,
                auto_init: false,
                license_template: 'mit'
            })
        });
        
        if (!createResponse.ok) {
            const error = await createResponse.json();
            throw new Error(`Failed to create repository: ${error.message}`);
        }
        
        const repo = await createResponse.json();
        console.log(`✅ Repository created: ${repo.html_url}`);
        
        // Add remote origin
        const { execSync } = require('child_process');
        execSync(`git remote add origin ${repo.clone_url}`, { stdio: 'inherit' });
        
        // Push to GitHub
        console.log('📤 Pushing code to GitHub...');
        execSync('git push -u origin main', { stdio: 'inherit' });
        
        console.log('🎉 Successfully deployed to GitHub!');
        console.log(`🌐 Repository URL: ${repo.html_url}`);
        console.log(`📋 Clone URL: ${repo.clone_url}`);
        
        return repo;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    createGitHubRepo().catch(console.error);
}

module.exports = createGitHubRepo;