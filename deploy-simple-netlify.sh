#!/bin/bash

echo "🚀 Deploying Echo HTML Editor to Netlify"
echo "========================================"
echo ""

# Create a clean deployment directory
DEPLOY_DIR="netlify-deploy"
rm -rf $DEPLOY_DIR
mkdir $DEPLOY_DIR

echo "📦 Preparing files for deployment..."

# Copy all necessary files
cp index.html $DEPLOY_DIR/
cp app.js $DEPLOY_DIR/
cp styles.css $DEPLOY_DIR/
cp visual-editor.js $DEPLOY_DIR/
cp github-integration.js $DEPLOY_DIR/
cp folder-processor.js $DEPLOY_DIR/
cp resizable-panels.js $DEPLOY_DIR/
cp netlify-integration.js $DEPLOY_DIR/
cp netlify.toml $DEPLOY_DIR/
cp _redirects $DEPLOY_DIR/
cp README.md $DEPLOY_DIR/

echo "✅ Files prepared in $DEPLOY_DIR directory"
echo ""
echo "📋 Deployment options:"
echo ""
echo "Option 1: Drag & Drop (Easiest)"
echo "-------------------------------"
echo "1. Open: https://app.netlify.com/drop"
echo "2. Drag the '$DEPLOY_DIR' folder to the drop zone"
echo "3. Your Echo HTML Editor will be live instantly!"
echo ""
echo "Option 2: Connect to GitHub"
echo "---------------------------"
echo "1. Go to: https://app.netlify.com"
echo "2. Click 'New site from Git'"
echo "3. Connect to: https://github.com/417ps/echo-html-editor"
echo "4. Deploy settings: Build command: (leave empty), Publish dir: (leave empty)"
echo ""
echo "🌐 The Echo HTML Editor will be available at:"
echo "   https://[random-name].netlify.app"
echo ""
echo "🎯 Features included in deployment:"
echo "   ✓ Visual HTML editor with click-to-edit"
echo "   ✓ Folder upload and project management"
echo "   ✓ GitHub integration for auto-deployment"
echo "   ✓ Netlify integration for hosting"
echo "   ✓ Resizable panels for custom workspace"
echo "   ✓ Multi-file support and syntax highlighting"

# Open Netlify drop page
open https://app.netlify.com/drop

echo ""
echo "🚀 Netlify drop page opened - drag the '$DEPLOY_DIR' folder to deploy!"