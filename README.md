> ⚠️ **PRE-ALPHA SOFTWARE**: This is version 2025.01.02 - untested and under heavy development. Use at your own risk!

> ⚠️ **PRE-ALPHA SOFTWARE**: This is version 2025.01.02 - untested and under heavy development. Use at your own risk!

# Dev 2 Dev Claude Tools Public

A tool to centralize Claude Code conversations by user directory and ensure no traces of Claude usage remain in project directories or git commits.

## Features

- Centralize Claude Code chat histories by user directory rather than project directory
- Clean projects of any Claude-related files or traces
- Work within project directory contexts while maintaining clean git history
- Monitor Claude API usage to avoid hitting limits and downgrades
- Track usage patterns and get warnings before reaching thresholds
- Adaptive learning system that refines limits based on actual throttle events
- Automatic detection of rate limiting and downgrade messages
- Integrates with Claude Code's existing infrastructure
- Completely user-directory based - no system-level modifications

## System Requirements

This tool is being developed and tested on:
- Linux: Debian 12 (Q4OS distribution with Trinity Desktop Environment)
- macOS

**Note:** This tool has not been tested on other Linux distributions, Windows, or other operating systems at this time.

## Installation

```bash
# Clone the repository
git clone https://github.com/dev2devportal/d2d-claude-tools.git
cd d2d-claude-tools-private

# Option 1: If nvm is already installed and configured in your shell
./claude-env npm install
./claude-env npm run setup

# Option 2: If you need to set up nvm first
./scripts/setup-nvm.sh
# Then open a new terminal or source your shell profile
source ~/.bashrc  # or ~/.zshrc depending on your shell
# Then continue with:
./claude-env npm install
./claude-env npm run setup
```

**Note:** The setup script detects nvm in standard locations including `~/.nvm`, `~/.config/nvm`, and `~/.configtde/nvm` (for Trinity Desktop users).

## Usage

### Starting the Claude Environment

```bash
# Start a bash shell in the Claude environment
./claude-env

# Start VSCodium in the Claude environment
./claude-env codium /path/to/project

# Run any command in the Claude environment
./claude-env npm test
```

### Making Tools Available System-Wide (Optional)

If you want the tools available in all terminals without using claude-env:

```bash
./scripts/install-path.sh
source ~/.bashrc  # or ~/.zshrc
```

### Using Claude Tools

Within the Claude environment (or system-wide if installed), all tools are available:

```bash
# Clean Claude traces from current directory recursively
claude-clean -r

# View previous chat histories
claude-history list

# Monitor Claude usage
claude-usage-monitor              # Show current status
claude-usage-monitor record       # Record a message sent
claude-usage-monitor record 5     # Record 5 messages
claude-usage-monitor history      # Show usage history

# Use the Claude CLI wrapper (if you have Claude CLI installed)
claude-wrapper                    # Runs claude with automatic usage tracking
```

See the [Tools Reference](docs/TOOLS_REFERENCE.md) for complete documentation of all commands and options.

Or run directly without entering the environment:

```bash
./claude-env claude-clean -r
./claude-env claude-history
```

## Configuration

The tool stores centralized chat histories in a configurable location, organized by user directory rather than project directory.

Default Claude Code chat location: `~/.config/claude-code/`
Centralized storage location: `~/.claude-centralized/` (configurable)

## Node.js Isolation

This project uses nvm (Node Version Manager) to maintain a completely isolated Node.js environment:
- Dedicated Node.js version (18.19.0) that won't conflict with other projects
- Isolated npm packages in the project's node_modules
- No system-wide Node.js modifications
- Works alongside any other Node.js projects without conflicts

The `claude-env` script automatically:
- Switches to the Claude-specific Node version
- Sets up the PATH for Claude tools
- Configures the centralized storage location
- Provides an isolated shell or launches your editor

## Development

This project:
- Uses local node_modules only
- Creates executable scripts in ./bin/ directory
- Never requires sudo or global npm installs
- Maintains complete isolation from other Node.js projects

## Repository

- GitHub: https://github.com/dev2devportal/d2d-claude-tools
- Public release: https://github.com/dev2devportal/d2d-claude-tools

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- [Tools Reference](docs/TOOLS_REFERENCE.md) - Complete reference for all tools, commands, and options
- [VSCodium Workflow](docs/CODIUM_WORKFLOW.md) - Using Claude Code in VSCodium with full tracking
- [Live Monitor Guide](docs/LIVE_MONITOR_GUIDE.md) - Understanding every field in the real-time monitor
- [Architecture Documentation](docs/ARCHITECTURE.md) - System design and component details
- [Usage Guide](docs/USAGE_GUIDE.md) - Detailed usage instructions and workflows
- [API Reference](docs/API_REFERENCE.md) - Technical API documentation
- [FAQ](docs/FAQ.md) - Frequently asked questions
- [References](docs/REFERENCES.md) - Official and community resources about Claude limits
- [Centralized Chat](docs/CENTRALIZED_CHAT.md) - How the chat centralization system works

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

Copyright (C) 2025 Hawke Robinson



This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.