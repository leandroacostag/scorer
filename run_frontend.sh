#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "Environment variables loaded from .env file"
else
  echo "No .env file found in root directory"
fi

# Start frontend
echo "Starting frontend..."
cd frontend

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Start the development server
echo "Starting React development server..."
npm run start:local

# Note: This script will keep running until manually stopped (Ctrl+C) 