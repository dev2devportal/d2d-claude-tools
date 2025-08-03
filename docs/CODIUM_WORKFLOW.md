# VSCodium + Claude Code Workflow

This guide explains how to use Claude Code in VSCodium terminals with d2d-claude-tools for centralized chat storage and automatic usage tracking.

## Understanding the Integration

**claude-wrapper** wraps the real Claude Code CLI to provide:
- Automatic usage tracking (messages, tokens, concurrent sessions)
- Centralized chat storage in `~/.claude-centralized`
- Usage warnings before hitting API limits
- Threshold learning from actual throttle events
- All the normal Claude Code functionality you're used to

## Setup Process

### 1. Initial Setup (One Time)

```bash
# Clone the tools
cd ~
git clone https://git.dev2dev.net/claudecode1/d2d-claude-tools-private.git
cd d2d-claude-tools-private

# Set up Node environment
./scripts/setup-nvm.sh
source ~/.bashrc

# Install and configure
./claude-env npm install
./claude-env npm run setup

# Install tools in PATH
./scripts/install-path.sh
source ~/.bashrc
```

### 2. Verify Claude Code is Installed

```bash
# Check if Claude Code CLI is available
which claude
# Should show: /usr/local/bin/claude or similar

# If not installed, install Claude Code from:
# https://claude.ai/download
```

## Daily Workflow

### Starting Your Work Session

1. **Open a terminal for live monitoring** (RECOMMENDED)
   ```bash
   # Start the live monitor to watch usage in real-time
   claude-monitor-live
   
   # Or for Max tier with potential 6-hour resets:
   claude-monitor-live --reset-hours 6 --alert-threshold 65
   ```
   Keep this terminal visible while working!

2. **In another terminal, navigate to your project**
   ```bash
   cd ~/Documents/Dev2Dev/Clients/MyProject/feature-branch
   ```

3. **Start VSCodium**
   ```bash
   codium .
   ```

4. **In VSCodium's integrated terminal, use claude-wrapper**
   ```bash
   claude-wrapper
   ```

That's it! You now have:
- ✅ Full Claude Code interface with menus and prompts
- ✅ Real-time usage monitoring in separate terminal
- ✅ Warnings BEFORE hitting limits
- ✅ Automatic usage tracking
- ✅ Centralized chat storage
- ✅ No `.claude` directories in your project

### What You'll See

When you run `claude-wrapper`, you'll see:

1. **Usage Status First**
   ```
   === Claude Usage Monitor ===
   Subscription: Max [ESTIMATED]
   Messages: 23 / 1500 (1.5%)
   Tokens: 99 / 10.0M (0.0%)
   Active Sessions: 1 / 7 concurrent
   Combined Usage: ░░░░░░░░░░░░░░░░░░ 1.5%
   Reset in: 19h 22m
   
   ✓ Usage is within safe limits
   ```

2. **Then Normal Claude Code Interface**
   ```
   ✻ Welcome to Claude Code!

   /help for help, /status for your current setup

   cwd: /your/project/directory

   Tips for getting started:

   1. Run /init to create a CLAUDE.md file with instructions for Claude
   2. Use Claude to help with file analysis, editing, bash commands and git
   3. Be as specific as you would with another engineer for the best results
   4. ✔ Run /terminal-setup to set up terminal integration

   ※ Tip: Press Esc twice to edit your previous messages

   >
   ```

### Live Monitor Display

In your monitoring terminal, you'll see a real-time dashboard:

```
┌─────────────────────────────────────────────────────────┐
│         Claude Usage Monitor - Live                     │
├─────────────────────────────────────────────────────────┤
│ ┌─ Current Usage ─────┐ ┌─ Active Sessions ────────┐   │
│ │ Subscription: Max   │ │ Active: 2 / 7          │   │
│ │                     │ │ Today: 5 total         │   │
│ │ Messages: 234/1500  │ │                        │   │
│ │ (15.6%)            │ │ Current Sessions:       │   │
│ │ Tokens: 1.2M/10.0M │ │  • 12345 - 45m         │   │
│ │ (12.0%)            │ │  • 67890 - 12m         │   │
│ │                     │ │                        │   │
│ │ Reset in: 4h 32m   │ │                        │   │
│ │ Safe rate: 62 msg/hr│ │                        │   │
│ └─────────────────────┘ └────────────────────────┘   │
│                                                        │
│ ┌─ Combined Usage ──────────────────────────────────┐ │
│ │ ████████░░░░░░░░░░░░░░░░░░░░ 26.7%              │ │
│ └──────────────────────────────────────────────────┘ │
│                                                        │
│ ┌─ Alerts ──────────────────────────────────────────┐ │
│ │ [10:32:15] ⚠️  WARNING: Usage above 70%          │ │
│ │ [10:45:22] ⚠️  Current rate exceeds safe rate    │ │
│ └──────────────────────────────────────────────────┘ │
│          Press q to quit | Updates every 5s           │
└─────────────────────────────────────────────────────────┘
```

## Features While Working

### Checking Usage

In any terminal (separate from Claude Code session):
```bash
# Quick status check
claude-usage-monitor

# Detailed history
claude-usage-monitor history 30

# Threshold learning report
claude-usage-monitor threshold-report
```

### Cleaning Projects

Before committing code:
```bash
# See what would be removed
claude-clean -n -r

# Actually clean
claude-clean -r
```

### Viewing Chat History

```bash
# List all conversations
claude-history list

# Search conversations
claude-history search "database migration"

# Show specific conversation
claude-history show conv_12345
```

## How It Works

1. **claude-wrapper intercepts the Claude Code CLI**
   - Shows current usage before starting
   - Creates session tracking file
   - Runs the real Claude Code CLI
   - Captures output to count messages/tokens
   - Updates usage statistics
   - Detects throttle messages for learning

2. **Centralized Storage**
   - All chats go to `~/.claude-centralized`
   - No `.claude` directories in projects
   - Can continue conversations across projects

3. **Automatic Tracking**
   - Messages and tokens counted from Claude's output
   - Concurrent sessions tracked
   - Throttle events logged for threshold adaptation

## Multiple Projects Workflow

```bash
# Project A - morning work
cd ~/projects/project-a
codium .
# In terminal: claude-wrapper
# Work on feature X...

# Project B - afternoon work
cd ~/projects/project-b
codium .
# In terminal: claude-wrapper
# Can reference morning's conversation!

# End of day - check everything
claude-history list
claude-usage-monitor
```

## Troubleshooting

### "claude-wrapper: command not found"

```bash
cd ~/d2d-claude-tools-private
./scripts/install-path.sh
source ~/.bashrc
```

### "Error: Claude Code CLI not found"

Install Claude Code from https://claude.ai/download

### Wrong Node version errors

Always use through claude-env or ensure nvm is using claude-tools:
```bash
nvm use claude-tools
```

### Chat not being centralized

Check if claude-wrapper is running properly:
```bash
# Should show usage stats first
claude-wrapper --version
```

## Best Practices

1. **Always use `claude-wrapper`** in project terminals
2. **Check usage regularly** - especially if you're a heavy user
3. **Clean before commits** - run `claude-clean -r`
4. **Report throttling** - helps improve threshold estimates
5. **Search first** - use `claude-history search` to find previous solutions

## Advanced Usage

### Custom Storage Location

```bash
export CLAUDE_STORAGE_PATH=~/my-claude-storage
echo 'export CLAUDE_STORAGE_PATH=~/my-claude-storage' >> ~/.bashrc
```

### Debugging Issues

```bash
# Enable debug mode
DEBUG=1 claude-wrapper

# Check what's in current directory
claude-clean -n

# Verify session files
ls ~/.claude-centralized/sessions/
```

### Integration with Git Hooks

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
claude-clean -r
```

## Summary

With this setup:
- Use `claude-wrapper` instead of `claude` for full tracking
- Get the complete Claude Code experience you're used to
- All benefits of d2d-claude-tools (tracking, centralization, cleaning)
- No changes to your normal Claude Code workflow
- Projects stay clean of Claude artifacts

The key difference from regular Claude Code:
- Type `claude-wrapper` instead of `claude`
- See usage stats before Claude starts
- Chats stored centrally, not in projects
- Automatic usage tracking and warnings