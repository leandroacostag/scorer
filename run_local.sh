#!/bin/bash

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "tmux is not installed. Please install it or run the backend and frontend separately."
    echo "You can run './run_backend.sh' in one terminal and './run_frontend.sh' in another."
    exit 1
fi

# Start a new tmux session
tmux new-session -d -s scorer

# Split the window horizontally
tmux split-window -h -t scorer

# Run backend in the left pane
tmux send-keys -t scorer:0.0 "cd $(pwd) && ./run_backend.sh" C-m

# Run frontend in the right pane
tmux send-keys -t scorer:0.1 "cd $(pwd) && ./run_frontend.sh" C-m

# Attach to the session
tmux attach-session -t scorer

# When the session is detached or closed, clean up
echo "Stopping all processes..." 