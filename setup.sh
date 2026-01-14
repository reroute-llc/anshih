#!/bin/bash

echo "🎮 Setting up Anshih - 80's Media Hub..."
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development servers, run:"
echo "  npm run dev"
echo ""
echo "This will start:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend:  http://localhost:3001"
echo ""
