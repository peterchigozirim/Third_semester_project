#!/bin/bash

# Render Deployment Quick Start Script
# This script helps you prepare and deploy to Render

echo "🚀 Eventful - Render Deployment Helper"
echo "========================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git repository not initialized"
    echo "   Run: git init"
    exit 1
fi

# Check if remote is set
if ! git remote | grep -q origin; then
    echo "❌ No git remote 'origin' found"
    echo "   Run: git remote add origin <your-github-repo-url>"
    exit 1
fi

# Check if render.yaml exists
if [ ! -f render.yaml ]; then
    echo "❌ render.yaml not found"
    exit 1
fi

echo "✅ Git repository configured"
echo "✅ render.yaml found"
echo ""

# Verify build locally
echo "📦 Testing build locally..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - fix errors before deploying"
    exit 1
fi

echo ""
echo "📝 Pre-deployment Checklist:"
echo "----------------------------"
echo "1. ✅ Git repository initialized"
echo "2. ✅ render.yaml configured"
echo "3. ✅ Build tested successfully"
echo ""
echo "❓ Have you prepared these secrets?"
echo "   - Paystack API keys (test or live)"
echo "   - Gmail app password for SMTP"
echo "   - Frontend URL"
echo ""

read -p "Continue with deployment? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Prepare for Render deployment" || echo "No changes to commit"
git push origin main || git push origin master

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "📋 Next Steps:"
echo "-------------"
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New' → 'Blueprint'"
echo "3. Connect your GitHub repository"
echo "4. Select this repository"
echo "5. Configure environment variables:"
echo "   - PAYSTACK_SECRET_KEY"
echo "   - PAYSTACK_PUBLIC_KEY"
echo "   - PAYSTACK_CALLBACK_URL"
echo "   - SMTP_USER"
echo "   - SMTP_PASSWORD"
echo "   - EMAIL_FROM"
echo "   - FRONTEND_URL"
echo "6. Click 'Apply'"
echo "7. Wait for deployment to complete"
echo "8. Open Shell and run: npm run migrate"
echo ""
echo "📚 For detailed instructions, see: RENDER_DEPLOYMENT.md"
echo ""
echo "🎉 Happy deploying!"
