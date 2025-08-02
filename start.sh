#!/bin/bash

echo "🚀 Starting Job Portal Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please update the .env file with your configuration values."
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../client
npm install

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update the .env file in the server directory with your configuration"
echo "2. Start MongoDB (if using local database)"
echo "3. Run the following commands in separate terminals:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   cd server && npm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   cd client && npm start"
echo ""
echo "🌐 The application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo ""
echo "📚 For more information, check the README.md file."