#!/bin/bash

# setup-nvm.sh
# This script attempts to install nvm and configure a dedicated Node environment for Claude tools

set -e

CLAUDE_NODE_VERSION="18.19.0"
CLAUDE_NODE_ALIAS="claude-tools"

echo "Setting up nvm and Claude-specific Node environment..."

# Check multiple possible nvm locations
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo "nvm found in ~/.nvm"
    export NVM_DIR="$HOME/.nvm"
elif [ -s "$HOME/.configtde/nvm/nvm.sh" ]; then
    echo "nvm found in ~/.configtde/nvm"
    export NVM_DIR="$HOME/.configtde/nvm"
elif [ -s "$HOME/.config/nvm/nvm.sh" ]; then
    echo "nvm found in ~/.config/nvm"
    export NVM_DIR="$HOME/.config/nvm"
else
    echo "Installing nvm..."
    # Download and install nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Source nvm for current session
    export NVM_DIR="$HOME/.nvm"
fi

# Source nvm from the detected directory
echo "Sourcing nvm from $NVM_DIR..."
if [ -s "$NVM_DIR/nvm.sh" ]; then
    # Source nvm and its bash completion if available
    source "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && source "$NVM_DIR/bash_completion"
    echo "nvm loaded successfully"
else
    echo "Error: Could not source nvm from $NVM_DIR/nvm.sh"
    exit 1
fi

# Check if nvm is available
if ! type nvm &> /dev/null; then
    echo "Error: nvm command not found after sourcing"
    echo "This might be because nvm needs to be sourced in your shell profile"
    echo "Try running: source $NVM_DIR/nvm.sh"
    exit 1
fi

# Install the specific Node version for Claude tools
echo "Installing Node.js $CLAUDE_NODE_VERSION for Claude tools..."
nvm install $CLAUDE_NODE_VERSION

# Create an alias for easy switching
echo "Creating '$CLAUDE_NODE_ALIAS' alias..."
nvm alias $CLAUDE_NODE_ALIAS $CLAUDE_NODE_VERSION

# Use this version for current session
nvm use $CLAUDE_NODE_ALIAS

# Create .nvmrc file in the project directory
echo "$CLAUDE_NODE_VERSION" > "$(dirname "$0")/../.nvmrc"

echo ""
echo "nvm setup complete!"
echo "Node.js $CLAUDE_NODE_VERSION has been installed and aliased as '$CLAUDE_NODE_ALIAS'"
echo ""
echo "To use Claude tools environment in the future, run:"
echo "  nvm use $CLAUDE_NODE_ALIAS"
echo "Or use the claude-env script to start an isolated session"