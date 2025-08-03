# D2D Claude Tools Reference Guide

This document provides detailed information about each tool in the d2d-claude-tools suite, including all available commands, options, and usage examples.

## Table of Contents

- [claude-clean](#claude-clean)
- [claude-history](#claude-history)
- [claude-config](#claude-config)
- [claude-usage-monitor](#claude-usage-monitor)
- [claude-wrapper](#claude-wrapper)
- [claude-env](#claude-env)

For specific workflows, see:
- [VSCodium + Claude Code Workflow](CODIUM_WORKFLOW.md) - Using Claude Code in VSCodium with full tracking

## claude-clean

Removes Claude-related artifacts from project directories to prevent accidental commits.

### Usage

```bash
claude-clean [options] [directory]
```

### Options

- `-r, --recursive` - Clean recursively through all subdirectories
- `-n, --dry-run` - Show what would be removed without actually removing
- `-v, --verbose` - Show detailed information about each item
- `-h, --help` - Display help information
- `-V, --version` - Display version number

### What it removes

- `.claude` directories (Claude Code artifacts)
- `CLAUDE.md` files (except in the d2d-claude-tools project itself)
- `.clauderc` files
- `claude-project.json` files
- Files matching `.claude*` pattern

### Examples

```bash
# Clean current directory
claude-clean

# Clean recursively
claude-clean -r

# Dry run to see what would be removed
claude-clean -r -n

# Clean a specific directory recursively
claude-clean -r ~/projects/my-project

# Verbose output
claude-clean -r -v
```

## claude-history

View and search centralized Claude chat histories stored in `~/.claude-centralized`.

### Usage

```bash
claude-history [command] [options]
```

### Commands

#### list
List all conversations

```bash
claude-history list [options]
```

Options:
- `-l, --limit <number>` - Number of conversations to show (default: 20)
- `-s, --sort <field>` - Sort by field: date, messages, project (default: date)
- `-r, --reverse` - Reverse sort order
- `-p, --project <name>` - Filter by project name

#### show
Show details for a specific conversation

```bash
claude-history show <conversation-id>
```

#### search
Search conversations by content

```bash
claude-history search <query>
```

#### stats
Show storage statistics

```bash
claude-history stats
```

### Examples

```bash
# List recent conversations
claude-history list

# List 50 most recent conversations
claude-history list -l 50

# List conversations for a specific project
claude-history list -p "my-project"

# Show a specific conversation
claude-history show conv_12345

# Search for conversations mentioning "database"
claude-history search database

# Show storage statistics
claude-history stats
```

## claude-config

Configure Claude tools settings (Note: Storage path configuration is done via environment variable).

### Usage

```bash
claude-config [command] [options]
```

### Commands

#### show
Display current configuration

```bash
claude-config show
```

#### set
Set configuration values

```bash
claude-config set <key> <value>
```

Available keys:
- `subscription` - Set subscription tier (free, pro, max)
- `verbose` - Enable/disable verbose output (true, false)

### Environment Variables

- `CLAUDE_STORAGE_PATH` - Override default storage location (default: `~/.claude-centralized`)

### Examples

```bash
# Show current configuration
claude-config show

# Set subscription tier
claude-config set subscription max

# Enable verbose output
claude-config set verbose true

# Use custom storage location
export CLAUDE_STORAGE_PATH=~/my-claude-chats
```

## claude-usage-monitor

Monitor Claude API usage to avoid hitting limits and prevent downgrades.

### Usage

```bash
claude-usage-monitor [command] [options]
```

### Commands

#### status
Show current usage status (default command)

```bash
claude-usage-monitor status
```

#### record
Record message(s) sent to Claude

```bash
claude-usage-monitor record [count]
```

Arguments:
- `count` - Number of messages to record (default: 1)

#### set-subscription
Set subscription tier

```bash
claude-usage-monitor set-subscription <tier>
```

Tiers:
- `free` - Free tier limits
- `pro` - Pro tier limits
- `max` - Max tier limits

#### history
Show usage history

```bash
claude-usage-monitor history [days]
```

Arguments:
- `days` - Number of days to show (default: 7)

#### clear
Clear all usage data

```bash
claude-usage-monitor clear
```

#### process-sessions
Process session files (automatically called by claude-wrapper)

```bash
claude-usage-monitor process-sessions
```

#### export-current
Export current usage data (used by claude-wrapper)

```bash
claude-usage-monitor export-current
```

#### analyze-thresholds
Analyze throttle events and adapt limits

```bash
claude-usage-monitor analyze-thresholds
```

#### threshold-report
Show threshold learning report

```bash
claude-usage-monitor threshold-report
```

### Examples

```bash
# Check current usage
claude-usage-monitor
claude-usage-monitor status

# Record a single message
claude-usage-monitor record

# Record 5 messages
claude-usage-monitor record 5

# Set to Pro subscription
claude-usage-monitor set-subscription pro

# View last 30 days of history
claude-usage-monitor history 30

# View threshold learning report
claude-usage-monitor threshold-report
```

### Usage Display

The monitor shows:
- Subscription tier and whether it's using estimates or learned limits
- Message count and limit
- Token count and limit (estimated)
- Active concurrent sessions
- Combined usage percentage with visual progress bar
- Time until reset
- Warnings if approaching limits
- Remaining messages and safe usage rate

## claude-wrapper

Wrapper for the Claude CLI that automatically tracks usage and manages concurrent sessions.

### Usage

```bash
claude-wrapper [claude-cli-options]
```

This is a transparent wrapper - it passes all arguments directly to the actual Claude CLI while tracking usage in the background.

### Features

- Automatically creates session tracking files
- Monitors for rate limit messages
- Updates usage statistics in real-time
- Detects and logs throttle events for adaptive learning
- Shows usage status before running Claude

### Environment Variables

- `CLAUDE_STORAGE_PATH` - Override storage location
- `DEBUG` - Enable debug output

### Examples

```bash
# Use like normal Claude CLI
claude-wrapper "What is the capital of France?"

# All Claude CLI options work
claude-wrapper --model claude-3-opus-20240229 "Explain quantum computing"

# View debug information
DEBUG=1 claude-wrapper "Hello"
```

## claude-env

Environment wrapper that activates the Claude tools environment with proper Node.js isolation.

### Usage

```bash
# Start interactive shell
./claude-env

# Run a command
./claude-env <command> [args...]
```

### Features

- Automatically switches to Node.js 18.19.0 using nvm
- Adds all Claude tools to PATH within the environment
- Shows usage status on startup
- Isolates Node.js environment to prevent version conflicts
- Works with any command (VSCodium, npm, etc.)

### Examples

```bash
# Start bash shell with Claude tools
./claude-env

# Open VSCodium with Claude tools available
./claude-env codium ~/projects/my-project

# Run npm commands
./claude-env npm install
./claude-env npm test

# Run any command in the Claude environment
./claude-env python script.py
```

### Shell Functions

Inside the claude-env shell, tools are available as both commands and functions:

```bash
# Inside claude-env shell
[claude-env]$ claude-clean -r
[claude-env]$ claude-history list
[claude-env]$ claude-usage-monitor status
```

## Installation Options

### 1. Using claude-env (Recommended)

The safest approach that maintains isolation:

```bash
./claude-env
# Tools are now available in this shell
```

### 2. System-wide Installation

For convenience, you can install tools system-wide:

```bash
./scripts/install-path.sh
source ~/.bashrc  # or ~/.zshrc
```

This adds the tools to your PATH permanently.

## Common Workflows

### Before Committing Code

```bash
# Check for Claude artifacts
claude-clean -n -r

# Remove them
claude-clean -r
```

### Monitoring Usage

```bash
# Quick check
claude-usage-monitor

# Detailed history
claude-usage-monitor history 30

# After hitting limits
claude-usage-monitor analyze-thresholds
```

### Reviewing Claude Sessions

```bash
# List recent sessions
claude-history list

# Search for specific topics
claude-history search "database migration"

# Review a specific conversation
claude-history show conv_12345
```

## Troubleshooting

### Tools not found

If tools aren't available:

1. Make sure you're in a claude-env shell: `./claude-env`
2. Or install system-wide: `./scripts/install-path.sh`

### Permission denied

Make sure tools are executable:

```bash
./claude-env npm run setup
```

### Wrong Node.js version

The tools require Node.js 18.19.0. Use claude-env to ensure the correct version:

```bash
./claude-env node --version
# Should show v18.19.0
```

### Custom storage location

To use a different storage location:

```bash
export CLAUDE_STORAGE_PATH=~/my-claude-storage
claude-history list
```

## Best Practices

1. **Always use claude-clean before commits** - Run `claude-clean -r` before committing code
2. **Monitor usage regularly** - Check `claude-usage-monitor` to avoid hitting limits
3. **Use claude-env for isolation** - Prevents Node.js version conflicts
4. **Review throttle events** - Run `claude-usage-monitor threshold-report` after hitting limits
5. **Search before asking** - Use `claude-history search` to find previous solutions

## Support

For issues or questions:
- Check the [FAQ](FAQ.md)
- Review the [Architecture](ARCHITECTURE.md) documentation
- Submit issues to the appropriate repository