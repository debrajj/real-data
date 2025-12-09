#!/bin/bash

# AppMint Shopify App - Setup Script
echo "🚀 Setting up AppMint Shopify App..."

# Install root dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp env-template.txt .env
    echo "📝 Please edit .env with your credentials"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your Shopify and MongoDB credentials"
echo "2. Run 'npm run dev' to start the backend server"
echo "3. In another terminal, run 'cd frontend && npm run dev' to start the frontend"
echo ""
echo "For Netlify deployment:"
echo "1. Push to GitHub"
echo "2. Connect to Netlify"
echo "3. Add environment variables in Netlify dashboard"
echo ""
