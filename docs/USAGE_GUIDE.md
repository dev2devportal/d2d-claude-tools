# Detailed Usage Guide

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [Daily Workflow](#daily-workflow)
3. [Tool Reference](#tool-reference)
4. [Troubleshooting](#troubleshooting)
5. [Advanced Usage](#advanced-usage)

> **Note:** For complete documentation of all tools and their options, see the [Tools Reference](TOOLS_REFERENCE.md).

## Initial Setup

### Prerequisites
- Linux (tested on Debian 12) or macOS
- curl (for downloading nvm)
- git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://git.dev2dev.net/Dev2Dev/claude-tools.git
   cd claude-tools
   ```

2. **Set up nvm and Node environment**
   ```bash
   ./scripts/setup-nvm.sh
   ```
   This script will:
   - Install nvm if not present
   - Install Node.js 18.19.0
   - Create 'claude-tools' alias
   - Generate .nvmrc file

3. **Install dependencies**
   ```bash
   ./claude-env npm install
   ```

4. **Run setup**
   ```bash
   ./claude-env npm run setup
   ```

## Daily Workflow

### Starting Your Work Session

1. **Navigate to claude-tools directory**
   ```bash
   cd ~/claude-tools
   ```

2. **Start the Claude environment**
   ```bash
   # For interactive shell
   ./claude-env
   
   # For VSCodium
   ./claude-env codium ~/my-project
   
   # For VS Code
   ./claude-env code ~/my-project
   ```

3. **Work on your project**
   - All Claude tools are available in PATH
   - Node version is isolated from system
   - Environment variables are configured

### Cleaning Projects

Before committing code or sharing projects:

```bash
# Dry run to see what would be removed
claude-clean -d

# Actually clean the current directory
claude-clean

# Clean recursively with verbose output
claude-clean -r -v

# Clean a specific directory
claude-clean /path/to/project -r
```

### Viewing Chat History

```bash
# View all chats (coming soon)
claude-history

# Search by project path (coming soon)
claude-history --project /path/to/project

# Filter by date (coming soon)
claude-history --since 2025-01-01
```

## Tool Reference

> **For complete documentation of all tools, commands, and options, see the [Tools Reference](TOOLS_REFERENCE.md).**

### Quick Reference

#### claude-env

The main entry point for the isolated environment.

**Syntax:**
```bash
./claude-env [command] [arguments]
```

**Examples:**
```bash
# Start bash shell
./claude-env
./claude-env bash

# Launch editors
./claude-env codium .
./claude-env code ~/project

# Run commands
./claude-env npm test
./claude-env node --version
```

**Environment Variables Set:**
- `PATH`: Includes claude-tools bin directory
- `CLAUDE_TOOLS_HOME`: Path to claude-tools installation
- `CLAUDE_CENTRAL_STORAGE`: Centralized storage location

### claude-clean

Removes Claude-related artifacts from projects.

**Syntax:**
```bash
claude-clean [options] [directory]
```

**Options:**
- `-r, --recursive`: Clean subdirectories recursively
- `-d, --dry-run`: Show what would be removed without removing
- `-v, --verbose`: Show detailed output
- `-V, --version`: Show version number
- `-h, --help`: Show help

**Patterns Cleaned:**
- `.claude` directories
- `.claude-code` directories
- `claude-code` directories
- Files matching `*.claude*`
- `CLAUDE.md` files

### claude-history (Coming Soon)

Manages centralized chat histories.

**Planned Syntax:**
```bash
claude-history [options]
```

**Planned Options:**
- `--project <path>`: Filter by project path
- `--since <date>`: Show chats since date
- `--until <date>`: Show chats until date
- `--format <format>`: Output format (json, table, summary)

### claude-usage-monitor

Tracks Claude API usage to help avoid hitting limits and downgrades. Now includes automatic tracking of concurrent sessions and token usage.

**Syntax:**
```bash
claude-usage-monitor [command] [options]
```

**Commands:**
- `status`: Show current usage status (default) - includes tokens and sessions
- `record [count]`: Record message(s) sent to Claude (for manual tracking)
- `set-subscription <tier>`: Set subscription tier (free, pro, max)
- `history [days]`: Show usage history
- `clear`: Clear all usage data
- `process-sessions`: Process session files (called automatically)
- `analyze-thresholds`: Analyze throttle events and adapt limits
- `threshold-report`: Show detailed threshold learning report
- `export-current`: Export current usage (used internally)

**Automatic Tracking:**

When you use the `claude` command wrapper within the claude-env environment:
```bash
# Inside claude-env, this automatically tracks usage
claude "Help me write a Python script"

# Multiple concurrent sessions are tracked
# Terminal 1:
claude "Long running task 1"

# Terminal 2 (simultaneously):
claude "Long running task 2"
```

**Manual Tracking (if not using wrapper):**
```bash
# Record that you sent a message
claude-usage-monitor record

# Record multiple messages
claude-usage-monitor record 10
```

**Monitoring Examples:**
```bash
# Check current usage (shows messages, tokens, and active sessions)
claude-usage-monitor
claude-usage-monitor status

# Set your subscription tier
claude-usage-monitor set-subscription max

# View last 7 days of usage
claude-usage-monitor history
claude-usage-monitor history 30  # Last 30 days
```

**Features:**
- **Automatic session tracking** when using `claude` wrapper
- **Concurrent session monitoring** with warnings
- **Token usage estimation** (rough estimate based on text length)
- **Combined usage metrics** (messages + tokens)
- Visual progress bars with color coding
- Warnings for too many concurrent sessions
- Time until reset calculation
- Safe usage rate recommendations

**Understanding the Display:**
- **Messages**: Direct count of interactions
- **Tokens**: Estimated based on ~4 characters per token
- **Active Sessions**: Currently running claude processes
- **Combined Usage**: Uses the higher of message % or token %

**Adaptive Threshold Learning:**

The tool starts with estimated limits but adapts based on actual throttle events:

1. **Initial Mode** (ESTIMATED):
   - Uses conservative estimates based on community reports
   - Shows [ESTIMATED] badge in status display
   - Warns that limits are preliminary

2. **Adaptive Mode** (ADAPTED):
   - Activates after detecting 3+ throttle events
   - Shows [ADAPTED] badge in status display
   - Uses 90% of lowest observed throttle point as new limit
   - Displays confidence levels for each metric

3. **Throttle Detection**:
   - Monitors Claude output for rate limit messages
   - Automatically logs all usage metrics when throttled
   - Triggers threshold analysis to refine limits
   - Shows warning when throttle is detected

**Viewing Threshold Data:**
```bash
# See detailed threshold learning report
claude-usage-monitor threshold-report

# Manually trigger threshold analysis
claude-usage-monitor analyze-thresholds
```

**Initial Estimates (Based on Community Observations):**
- **Max tier**: 1500 messages/day, 10M tokens/day, 7 concurrent sessions
- **Pro tier**: 400 messages/day, 2M tokens/day, 4 concurrent sessions
- **Free tier**: 40 messages/day, 150K tokens/day, 1 concurrent session

These estimates are based on user reports from various sources (see [References](REFERENCES.md)).
They will be automatically adjusted as the tool learns from your actual usage patterns.

### claude-config (Coming Soon)

Manages configuration settings.

**Planned Syntax:**
```bash
claude-config [options]
```

**Planned Options:**
- `--storage-path <path>`: Set centralized storage location
- `--retention <days>`: Set chat retention period
- `--auto-clean`: Enable automatic cleaning
- `--list`: Show all settings

## Troubleshooting

### nvm not found

If you see "nvm: command not found":

1. **Ensure nvm is installed:**
   ```bash
   ./scripts/setup-nvm.sh
   ```

2. **Source your shell configuration:**
   ```bash
   source ~/.bashrc  # or ~/.zshrc for zsh
   ```

### Node version conflicts

If you have issues with Node versions:

1. **Check current version:**
   ```bash
   node --version
   ```

2. **Switch to Claude tools version:**
   ```bash
   nvm use claude-tools
   ```

3. **Verify isolation:**
   ```bash
   ./claude-env node --version
   ```

### Permission errors

If you encounter permission errors:

1. **Check file permissions:**
   ```bash
   ls -la ./claude-env
   ls -la ./bin/
   ```

2. **Fix permissions if needed:**
   ```bash
   chmod +x ./claude-env
   chmod +x ./bin/*.js
   ```

## Advanced Usage

### Custom Aliases

Add to your shell configuration:

```bash
# ~/.bashrc or ~/.zshrc
alias ce='~/claude-tools/claude-env'
alias cclean='~/claude-tools/claude-env claude-clean'
```

### Integration with Git Hooks

Create a pre-commit hook to ensure no Claude artifacts:

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run claude-clean in dry-run mode
~/claude-tools/claude-env claude-clean -d

# Check if any files would be removed
if [ $? -ne 0 ]; then
    echo "Error: Claude artifacts detected. Run 'claude-clean' before committing."
    exit 1
fi
```

### Automated Workflows

Create a script for your daily workflow:

```bash
#!/bin/bash
# ~/bin/start-coding

# Start Claude environment with your project
~/claude-tools/claude-env codium "$1"
```

### Environment Persistence

To automatically use Claude tools Node version in specific directories:

```bash
# Add to ~/.bashrc or ~/.zshrc
cd() {
    builtin cd "$@"
    if [ -f .nvmrc ]; then
        nvm use
    fi
}
```