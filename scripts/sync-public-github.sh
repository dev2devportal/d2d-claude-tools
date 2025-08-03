#!/bin/bash

# sync-public-github.sh
# This script syncs the sanitized public version with GitHub

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"
PUBLIC_DIR="$PROJECT_ROOT/d2d-claude-tools-public-version"

echo "=== Dev 2 Dev Claude Tools Public Sync ==="
echo "Pre-Alpha Version: 2025.01.02"
echo ""

# First, sanitize the current version
echo "Step 1: Sanitizing for public release..."
"$SCRIPT_DIR/sanitize-for-public.sh"

# Initialize git in public directory if needed
cd "$PUBLIC_DIR"
if [ ! -d .git ]; then
    echo "Step 2: Initializing git in public directory..."
    git init
    git remote add origin https://github.com/dev2devportal/d2d-claude-tools.git
else
    echo "Step 2: Git already initialized"
fi

# Configure git for this repository
git config user.name "Claude Code Bot"
git config user.email "claudecode1@dev2dev.net"

echo "Step 3: Preparing commit..."
git add -A
TIMESTAMP=$(date +%Y%m%d%H%M%S)
git commit -m "Update public version $TIMESTAMP

This is an automated sanitized copy from the private repository.
Version: 2025.01.02.$TIMESTAMP (Pre-Alpha)"

echo ""
echo "Step 4: Push to GitHub"
echo "You need to authenticate with GitHub."
echo ""
echo "Options:"
echo "1. Create a Personal Access Token at: https://github.com/settings/tokens"
echo "   - Select 'repo' scope"
echo "   - Use the token as the password when prompted"
echo ""
echo "2. Set up SSH keys:"
echo "   - Generate: ssh-keygen -t ed25519 -C 'claudecode1@dev2dev.net'"
echo "   - Add to GitHub: https://github.com/settings/keys"
echo ""
echo "Attempting to push..."

# Try to push
git push -u origin main || {
    echo ""
    echo "Push failed. Please set up authentication and try:"
    echo "cd $PUBLIC_DIR"
    echo "git push -u origin main"
}

cd "$PROJECT_ROOT"