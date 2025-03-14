#!/bin/bash

# Ensure environment variables are available
echo "Setting up environment..."
if [ -f .env ]; then
  echo "Using .env file"
else
  echo "Creating .env file from Heroku config"
  # Create a minimal .env file with required variables
  echo "REACT_APP_API_URL=$REACT_APP_API_URL" > .env
  echo "AUTH0_DOMAIN=$AUTH0_DOMAIN" >> .env
  echo "AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID" >> .env
  echo "AUTH0_AUDIENCE=$AUTH0_AUDIENCE" >> .env
fi

# Run the build
echo "Building application..."
npm run build

echo "Build completed successfully" 