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

echo ""
echo "✅ Setup complete!"
echo ""
echo "⚠️  Don't forget to:"
echo "  1. Create a .env.local file in the client/ directory"
echo "  2. Add your Supabase URL and anon key"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "This will start the frontend at:"
echo "  - Frontend: http://localhost:3000"
echo ""
