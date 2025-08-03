# Claude Tools Project Context

## Project Overview
This project provides tools to centralize Claude Code conversations and ensure no traces of Claude usage remain in project directories or git commits.

## Key Features
1. **Claude Clean** - Removes all Claude artifacts from projects
2. **Usage Monitor** - Tracks API usage to avoid hitting limits
3. **History Manager** - Centralizes chat histories by user directory
4. **Config Manager** - Manages tool configuration
5. **Claude Wrapper** - Automatically tracks usage when using Claude

## Project Structure
```
d2d-claude-tools-private/
├── bin/                    # Executable scripts
│   ├── claude             # Wrapper for Claude command
│   ├── claude-clean.js    # Removes Claude artifacts
│   ├── claude-config.js   # Configuration manager
│   ├── claude-history.js  # Chat history browser
│   └── claude-usage-monitor.js # Usage tracking
├── scripts/               # Setup and utility scripts
│   ├── setup-nvm.sh      # Sets up Node environment
│   ├── setup.js          # Makes scripts executable
│   ├── sanitize-for-public.sh # Creates public version
│   └── cleanup-sessions.sh # Emergency cleanup
├── claude-env            # Environment wrapper script
└── docs/                 # Documentation

```

## Development Guidelines
- Use Node.js 18.19.0 (managed by nvm)
- All tools run in user space - no sudo required
- Private repo: git.dev2dev.net/claudecode1/d2d-claude-tools-private
- Public repo: github.com/dev2devportal/d2d-claude-tools

## Testing
Always test changes in the testing directory before committing:
```bash
cd ~/Documents/Dev2Dev/Development/AI/testing
git clone https://git.dev2dev.net/claudecode1/d2d-claude-tools-private.git
cd d2d-claude-tools-private
./claude-env npm install
./claude-env npm run setup
```

## Known Issues
- The setup-nvm.sh script needs to be run in a new shell if nvm isn't already configured
- Trinity Desktop uses ~/.configtde/nvm instead of standard locations

## Usage Monitoring
The project tracks Claude API usage to help avoid hitting the "top 5%" limits that cause downgrades. It includes:
- Message counting
- Token estimation
- Concurrent session tracking
- Adaptive threshold learning from actual throttle events