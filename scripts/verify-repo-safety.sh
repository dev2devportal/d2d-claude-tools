#!/bin/bash

# verify-repo-safety.sh
# This script verifies that private and public repositories are properly separated

echo "=== Repository Safety Check ==="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PRIVATE_DIR="$( dirname "$SCRIPT_DIR" )"
PUBLIC_DIR="$PRIVATE_DIR/d2d-claude-tools-public-version"

# Check private repository
echo "Checking private repository..."
cd "$PRIVATE_DIR"

if git remote -v | grep -q "github.com"; then
    echo "❌ ERROR: GitHub remote found in private repository!"
    echo "   This could lead to accidental exposure of private code."
    echo "   Run: git remote remove <remote-name>"
    exit 1
else
    echo "✓ Private repository has no GitHub remotes"
fi

if git remote -v | grep -q "git.dev2dev.net"; then
    echo "✓ Private repository correctly points to Gitea"
    # Check which namespace
    if git remote -v | grep -q "git.dev2dev.net/claudecode1/"; then
        echo "  → Using claudecode1's personal namespace"
    elif git remote -v | grep -q "git.dev2dev.net/Dev2Dev/"; then
        echo "  → Using Dev2Dev organization namespace"
    fi
else
    echo "⚠️  WARNING: No Gitea remote found in private repository"
fi

# Check public directory
echo ""
echo "Checking public directory..."
if [ -d "$PUBLIC_DIR/.git" ]; then
    cd "$PUBLIC_DIR"
    
    if git remote -v | grep -q "git.dev2dev.net"; then
        echo "❌ ERROR: Private Gitea remote found in public directory!"
        echo "   This could lead to accidentally pushing public code to private repo."
        echo "   Run: git remote remove <remote-name>"
        exit 1
    else
        echo "✓ Public directory has no private remotes"
    fi
    
    if git remote -v | grep -q "github.com/dev2devportal/d2d-claude-tools"; then
        echo "✓ Public directory correctly points to GitHub"
    else
        echo "⚠️  WARNING: No GitHub remote found in public directory"
    fi
else
    echo "ℹ️  Public directory not initialized yet"
fi

# Check .gitignore
echo ""
echo "Checking .gitignore..."
cd "$PRIVATE_DIR"
if grep -q "d2d-claude-tools-public-version/" .gitignore; then
    echo "✓ Public directory is properly ignored in private repository"
else
    echo "❌ ERROR: Public directory not in .gitignore!"
    echo "   Add 'd2d-claude-tools-public-version/' to .gitignore"
    exit 1
fi

echo ""
echo "=== Safety check complete ==="