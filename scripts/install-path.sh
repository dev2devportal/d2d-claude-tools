#!/bin/bash

# install-path.sh
# This script adds claude tools to your PATH in your shell profile

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the tools directory
TOOLS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
BIN_DIR="$TOOLS_DIR/bin"

echo -e "${BLUE}Claude Tools PATH Installation${NC}"
echo "This will add the claude tools to your PATH"
echo ""

# Detect shell
SHELL_NAME=$(basename "$SHELL")
SHELL_RC=""

case "$SHELL_NAME" in
    bash)
        SHELL_RC="$HOME/.bashrc"
        ;;
    zsh)
        SHELL_RC="$HOME/.zshrc"
        ;;
    *)
        echo -e "${YELLOW}Warning: Unknown shell '$SHELL_NAME'${NC}"
        echo "You'll need to manually add this to your shell configuration:"
        echo "export PATH=\"$BIN_DIR:\$PATH\""
        exit 1
        ;;
esac

# Check if already in PATH
if grep -q "d2d-claude-tools-private/bin" "$SHELL_RC" 2>/dev/null; then
    echo -e "${GREEN}✓ Claude tools already in PATH${NC}"
    exit 0
fi

# Add to shell RC file
echo "" >> "$SHELL_RC"
echo "# Claude Tools" >> "$SHELL_RC"
echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$SHELL_RC"

echo -e "${GREEN}✓ Added claude tools to $SHELL_RC${NC}"
echo ""
echo "To use the tools immediately, run:"
echo -e "${YELLOW}  source $SHELL_RC${NC}"
echo ""
echo "Or start a new terminal session."