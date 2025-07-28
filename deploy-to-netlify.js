// Deploy to Netlify via API
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function deployToNetlify() {
    // You'll need to set your Netlify token
    const token = process.env.NETLIFY_TOKEN || 'your_netlify_token_here';
    
    if (token === 'your_netlify_token_here') {
        console.log('❌ Please set your NETLIFY_TOKEN environment variable');
        console.log('   export NETLIFY_TOKEN=your_token_here');
        console.log('   Generate token at: https://app.netlify.com/user/applications/personal');
        return;
    }
    
    try {
        console.log('🚀 Creating Netlify site...');
        
        // Create site
        const createResponse = await fetch('https://api.netlify.com/api/v1/sites', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'echo-html-editor',
                custom_domain: null
            })
        });
        
        if (!createResponse.ok) {
            const error = await createResponse.text();
            throw new Error(`Failed to create site: ${error}`);
        }
        
        const site = await createResponse.json();
        console.log(`✅ Site created: ${site.name}`);
        console.log(`🌐 Site URL: ${site.url}`);
        
        // Create deployment
        console.log('📤 Deploying files...');
        
        const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/zip'
            },
            body: await createZipBuffer()
        });
        
        if (!deployResponse.ok) {
            const error = await deployResponse.text();
            throw new Error(`Failed to deploy: ${error}`);
        }
        
        const deployment = await deployResponse.json();
        console.log('🎉 Successfully deployed to Netlify!');
        console.log(`🌐 Live URL: ${site.url}`);
        console.log(`📋 Admin URL: ${site.admin_url}`);
        
        return { site, deployment };
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

async function createZipBuffer() {
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // Add all files except git and node_modules
    const files = [
        'index.html',
        'app.js',
        'styles.css',
        'visual-editor.js',
        'github-integration.js',
        'folder-processor.js',
        'resizable-panels.js',
        'netlify.toml',
        '_redirects',
        'README.md'
    ];
    
    files.forEach(file => {
        if (fs.existsSync(file)) {
            archive.file(file, { name: file });
        }
    });
    
    archive.finalize();
    
    const chunks = [];
    archive.on('data', chunk => chunks.push(chunk));
    
    return new Promise((resolve, reject) => {
        archive.on('end', () => resolve(Buffer.concat(chunks)));
        archive.on('error', reject);
    });
}

// Simple implementation without archiver dependency
async function createSimpleZip() {
    // For now, let's use a simple approach
    const files = {
        'index.html': fs.readFileSync('index.html'),
        'app.js': fs.readFileSync('app.js'),
        'styles.css': fs.readFileSync('styles.css'),
        'visual-editor.js': fs.readFileSync('visual-editor.js'),
        'github-integration.js': fs.readFileSync('github-integration.js'),
        'folder-processor.js': fs.readFileSync('folder-processor.js'),
        'resizable-panels.js': fs.readFileSync('resizable-panels.js'),
        'netlify.toml': fs.readFileSync('netlify.toml'),
        '_redirects': fs.readFileSync('_redirects'),
        'README.md': fs.readFileSync('README.md')
    };
    
    return files;
}

// Manual deployment instructions
function showManualInstructions() {
    console.log('🚀 Manual Netlify Deployment Options:');
    console.log('=====================================');
    console.log('');
    console.log('Option 1: Drag & Drop (Easiest)');
    console.log('1. Open https://app.netlify.com/drop');
    console.log('2. Drag this entire folder to deploy');
    console.log('');
    console.log('Option 2: GitHub Integration');
    console.log('1. Connect your GitHub repo to Netlify');
    console.log('2. Auto-deploy on every push');
    console.log('');
    console.log('Option 3: CLI');
    console.log('1. npm install -g netlify-cli');
    console.log('2. netlify deploy --prod');
}

// Run if called directly
if (require.main === module) {
    showManualInstructions();
}

module.exports = { deployToNetlify, showManualInstructions };