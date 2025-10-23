#!/bin/bash
# Azure App Service Startup Script

echo "Starting PokeBinder Backend..."

# Navigate to backend directory
cd backend || exit 1

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
fi

# Start the server
echo "Starting Node.js server..."
node server.js
