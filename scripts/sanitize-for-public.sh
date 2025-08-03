#!/bin/bash

# sanitize-for-public.sh
# This script creates a sanitized copy for public release

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"
PUBLIC_DIR="$PROJECT_ROOT/d2d-claude-tools-public-version"

echo "Sanitizing project for public release..."

# Clean the public directory
rm -rf "$PUBLIC_DIR"/*
rm -rf "$PUBLIC_DIR"/.*

# Copy all files except sensitive ones
cp -r "$PROJECT_ROOT"/* "$PUBLIC_DIR/" 2>/dev/null || true
cp "$PROJECT_ROOT"/.gitignore "$PUBLIC_DIR/"
cp "$PROJECT_ROOT"/.nvmrc "$PUBLIC_DIR/"

# Remove the public version directory from itself
rm -rf "$PUBLIC_DIR/d2d-claude-tools-public-version"

# Remove sensitive scripts
rm -f "$PUBLIC_DIR/push-to-github.sh"
rm -f "$PUBLIC_DIR/SANITIZATION_NOTES.md"
rm -rf "$PUBLIC_DIR/.git"

# Update version to indicate pre-alpha
cd "$PUBLIC_DIR"

# Sanitize files
echo "Sanitizing README.md..."
sed -i 's|https://git.dev2dev.net/Dev2Dev/d2d-claude-tools|https://github.com/dev2devportal/d2d-claude-tools|g' README.md
sed -i 's|Private development:.*|GitHub: https://github.com/dev2devportal/d2d-claude-tools|' README.md
sed -i '/Public release (future):/d' README.md
sed -i 's|Email: hawkenterprising@gmail.com||' README.md
sed -i 's|Website: www.hawkerobinson.com||' README.md

# Add pre-alpha warning to README and update title
sed -i '1s/^/> ⚠️ **PRE-ALPHA SOFTWARE**: This is version 2025.01.02 - untested and under heavy development. Use at your own risk!\n\n/' README.md
sed -i 's/# Dev 2 Dev Claude Tools Private/# Dev 2 Dev Claude Tools Public/' README.md

echo "Sanitizing package.json..."
sed -i 's|"name": "d2d-claude-tools-private"|"name": "d2d-claude-tools"|' package.json
sed -i 's|"description": "Dev 2 Dev Claude Tools Private - |"description": "Dev 2 Dev Claude Tools Public - |' package.json
sed -i 's|Hawke Robinson <hawkenterprising@gmail.com>|Hawke Robinson|' package.json
sed -i '/"author":/a\  "repository": {\n    "type": "git",\n    "url": "git+https://github.com/dev2devportal/d2d-claude-tools.git"\n  },' package.json

echo "Sanitizing CONTRIBUTING.md..."
sed -i 's|https://git.dev2dev.net/Dev2Dev/d2d-claude-tools|https://github.com/dev2devportal/d2d-claude-tools|g' CONTRIBUTING.md
sed -i 's/# Contributing to Dev 2 Dev Claude Tools Private/# Contributing to Dev 2 Dev Claude Tools Public/' CONTRIBUTING.md
# Remove private git configuration section
sed -i '/## Git Configuration/,/## Code Style/{/## Code Style/!d;}' CONTRIBUTING.md
# Add GitHub workflow
sed -i '/## Development Setup/a\\n## Submitting Changes\n\n1. Fork the repository on GitHub\n2. Create a feature branch\n3. Commit your changes\n4. Push to the branch\n5. Open a Pull Request\n' CONTRIBUTING.md

# Create public-specific files if they don't exist
if [ ! -f "$PUBLIC_DIR/LICENSE" ]; then
    echo "Creating LICENSE file..."
    cat > "$PUBLIC_DIR/LICENSE" << 'EOF'
GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (C) 2025 Hawke Robinson

[Full GPL-3.0 text available at https://www.gnu.org/licenses/gpl-3.0.txt]
EOF
fi

if [ ! -f "$PUBLIC_DIR/SECURITY.md" ]; then
    cp "$SCRIPT_DIR/../SECURITY.md" "$PUBLIC_DIR/" 2>/dev/null || echo "SECURITY.md not found"
fi

if [ ! -f "$PUBLIC_DIR/CODE_OF_CONDUCT.md" ]; then
    cp "$SCRIPT_DIR/../CODE_OF_CONDUCT.md" "$PUBLIC_DIR/" 2>/dev/null || echo "CODE_OF_CONDUCT.md not found"
fi

echo "Sanitization complete!"
echo "Public version ready in: $PUBLIC_DIR"

# Safety check - ensure public directory has correct remote
echo ""
echo "Verifying Git remotes for safety..."
cd "$PUBLIC_DIR"
if git remote -v | grep -q "git.dev2dev.net"; then
    echo "WARNING: Private repository remote detected in public directory!"
    echo "Removing private remote for safety..."
    git remote remove origin 2>/dev/null || true
    echo "Please manually set the correct GitHub remote."
else
    echo "✓ No private remotes found in public directory"
fi

# Ensure only GitHub remote exists
if ! git remote -v | grep -q "github.com/dev2devportal/d2d-claude-tools"; then
    echo "Setting up correct GitHub remote..."
    git remote remove origin 2>/dev/null || true
    git remote add origin git@github.com:dev2devportal/d2d-claude-tools.git
    echo "✓ GitHub remote configured"
fi