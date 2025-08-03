# Architecture Documentation

## Overview

This project provides tools to centralize Claude Code conversations and ensure clean project directories. It uses Node.js with complete environment isolation via nvm.

## Component Architecture

### 1. Environment Isolation Layer

#### claude-env (Shell Script)
- **Purpose**: Provides an isolated Node.js environment for all Claude tools
- **Location**: `./claude-env`
- **Responsibilities**:
  - Sources nvm and switches to Claude-specific Node version
  - Adds claude-tools binaries to PATH
  - Sets up environment variables for centralized storage
  - Launches shells, editors, or executes commands in isolation

#### setup-nvm.sh
- **Purpose**: Installs nvm and configures the Claude-specific Node environment
- **Location**: `./scripts/setup-nvm.sh`
- **Functions**:
  - Downloads and installs nvm if not present
  - Installs Node.js 18.19.0 specifically for Claude tools
  - Creates 'claude-tools' alias for easy version switching
  - Generates .nvmrc file for automatic version detection

### 2. Core Tools

#### claude-clean
- **Purpose**: Removes Claude-related artifacts from project directories
- **Location**: `./bin/claude-clean.js`
- **Class**: `ClaudeCleaner`
- **Methods**:
  - `findClaudeFiles()`: Searches for Claude patterns using glob
  - `cleanFiles()`: Removes found artifacts with dry-run support
- **Patterns Detected**:
  - `.claude`, `.claude-code`, `claude-code` directories
  - Any files matching `*.claude*`
  - `CLAUDE.md` files

#### claude-history
- **Purpose**: Retrieves and displays centralized chat histories
- **Location**: `./bin/claude-history.js`
- **Class**: `ChatHistoryManager`
- **Features**:
  - Lists all centralized conversations
  - Searches by content or project path
  - Shows conversation details and statistics
  - Supports multiple storage locations

#### claude-config
- **Purpose**: Manages configuration settings
- **Location**: `./bin/claude-config.js`
- **Class**: `ConfigManager`
- **Settings**:
  - Centralized storage paths
  - Cleaning patterns and exclusions
  - Chat retention policies
  - Monitoring preferences

### 3. Storage Architecture

#### Default Locations
- Claude Code chats: `~/.config/claude-code/`
- Centralized storage: `~/.claude-centralized/`
- Project-specific config: `./.claude-tools/config.json`

#### Storage Structure
```
~/.claude-centralized/
├── by-project/
│   ├── project-hash-1/
│   │   ├── metadata.json
│   │   └── conversations/
│   └── project-hash-2/
└── by-date/
    └── 2025/
        └── 01/
```

## Data Flow

1. **Environment Setup**
   - User runs `./claude-env`
   - Script sources nvm and switches Node version
   - PATH is modified to include tool binaries
   - Environment variables are set

2. **Tool Execution**
   - Tools run within isolated Node environment
   - Access centralized storage location
   - Perform operations without affecting system Node

3. **Chat Centralization** (Planned)
   - Monitor Claude Code chat directory
   - Copy new conversations to centralized storage
   - Index by project path and date
   - Remove from project directory if configured

## Security Considerations

- No system-wide installations
- No sudo requirements
- All operations are user-directory scoped
- Credentials are never stored in code
- Git remotes use HTTPS with manual authentication

## Error Handling

All tools follow these error handling principles:
- Graceful degradation when dependencies are missing
- Clear error messages with suggested fixes
- Non-destructive operations by default
- Dry-run mode for potentially destructive operations

## Testing Strategy

- Unit tests for core functionality
- Integration tests for nvm setup
- Manual testing on Linux (Debian 12) and macOS
- Verify isolation from system Node installations