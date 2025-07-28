#!/bin/bash

# Echo HTML Editor - Netlify Deployment Script

echo "🚀 Deploying Echo HTML Editor to Netlify..."

# Check if netlify-cli is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Deploy to Netlify
echo "📡 Deploying to Netlify..."

# Check if site is already linked
if [ ! -f ".netlify/state.json" ]; then
    echo "🔗 Creating new Netlify site..."
    netlify init --manual
else
    echo "🔗 Using existing Netlify site..."
fi

# Deploy the site
netlify deploy --prod --dir=. --message="Deploy Echo HTML Editor with latest features"

echo "✅ Deployment complete!"
echo "🌐 Your Echo HTML Editor is now live!"

# Get the site URL
netlify open:site