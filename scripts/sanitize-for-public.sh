#!/bin/bash

# sanitize-for-public.sh
# This script creates a sanitized copy for public release

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PRIVATE_DIR="$( dirname "$SCRIPT_DIR" )"
PUBLIC_DIR="$HOME/Documents/Dev2Dev/Development/AI/d2d-claude-tools-public"

echo "Sanitizing project for public release..."
echo "Private source: $PRIVATE_DIR"
echo "Public destination: $PUBLIC_DIR"

# Ensure public directory exists
if [ ! -d "$PUBLIC_DIR" ]; then
    echo "Error: Public directory does not exist: $PUBLIC_DIR"
    echo "Please create it first: mkdir -p $PUBLIC_DIR"
    exit 1
fi

# Check if public directory has git initialized
if [ ! -d "$PUBLIC_DIR/.git" ]; then
    echo "Warning: Public directory does not have git initialized"
    echo "You should run: cd $PUBLIC_DIR && git init"
fi

# Clean the public directory (except .git)
echo "Cleaning public directory..."
find "$PUBLIC_DIR" -mindepth 1 -maxdepth 1 -name '.git' -prune -o -exec rm -rf {} +

# Copy all files except sensitive ones
echo "Copying files..."
cp -r "$PRIVATE_DIR"/* "$PUBLIC_DIR/" 2>/dev/null || true
cp "$PRIVATE_DIR"/.gitignore "$PUBLIC_DIR/"
cp "$PRIVATE_DIR"/.nvmrc "$PUBLIC_DIR/"

# Remove sensitive scripts
echo "Removing sensitive files..."
rm -f "$PUBLIC_DIR/push-to-github.sh"
rm -f "$PUBLIC_DIR/SANITIZATION_NOTES.md"

# Update version to indicate pre-alpha
cd "$PUBLIC_DIR"

# Sanitize files
echo "Sanitizing README.md..."
sed -i 's|https://git.dev2dev.net/claudecode1/d2d-claude-tools-private|https://github.com/dev2devportal/d2d-claude-tools|g' README.md
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
sed -i 's|https://git.dev2dev.net/claudecode1/d2d-claude-tools-private|https://github.com/dev2devportal/d2d-claude-tools|g' CONTRIBUTING.md
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

echo ""
echo "Sanitization complete!"
echo "Public version ready in: $PUBLIC_DIR"
echo ""
echo "Next steps:"
echo "1. cd $PUBLIC_DIR"
echo "2. git add -A"
echo "3. git commit -m 'Update from private repository'"
echo "4. git push origin main"