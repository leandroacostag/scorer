#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "Environment variables loaded from .env file"
else
  echo "No .env file found in root directory"
fi

# Function to check if conda is available
check_conda() {
  if command -v conda &> /dev/null; then
    echo "Conda is available"
    return 0
  else
    echo "Conda is not available. Will use system Python."
    return 1
  fi
}

# Function to check if a conda environment exists
check_env() {
  conda env list | grep -q "$1"
  return $?
}

# Start API server
echo "Starting API server on port 8000..."
cd api

# Try to activate conda environment if available
if check_conda; then
  # Check for common environment names
  if check_env "scorer-api"; then
    echo "Activating scorer-api conda environment"
    source "$(conda info --base)/etc/profile.d/conda.sh"
    conda activate scorer-api
  elif check_env "scorer"; then
    echo "Activating scorer conda environment"
    source "$(conda info --base)/etc/profile.d/conda.sh"
    conda activate scorer
  elif check_env "api"; then
    echo "Activating api conda environment"
    source "$(conda info --base)/etc/profile.d/conda.sh"
    conda activate api
  else
    echo "No matching conda environment found. Using current environment."
  fi
fi

# Install dependencies if needed
echo "Installing dependencies..."
pip install -r requirements.txt

# Start the API server
echo "Starting uvicorn server..."
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Note: This script will keep running until manually stopped (Ctrl+C) 