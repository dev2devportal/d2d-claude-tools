# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project uses Calendar Versioning (CalVer): YYYY.MM.DD.HHMMSS

> ⚠️ **PRE-ALPHA SOFTWARE**: This project is in early development and largely untested.

## [Unreleased]

### Added
- Initial project structure and documentation
- `claude-clean` tool for removing Claude artifacts from projects
- `claude-env` wrapper script for isolated Node.js environment
- nvm setup script for Node.js version management
- `claude-usage-monitor` tool for tracking API usage and preventing downgrades
- `claude` wrapper script for automatic usage tracking
- Comprehensive documentation in `docs/` directory
- Support for dry-run mode in claude-clean
- Recursive directory cleaning option
- Verbose output mode
- Usage tracking with visual progress bars
- Subscription tier management (free, pro, max)
- Usage history tracking and reporting
- Time until reset calculations
- Safe usage rate recommendations
- Concurrent session tracking and warnings
- Token usage estimation
- Adaptive threshold learning system
- Automatic throttle detection and logging
- Threshold analysis based on actual events
- Dynamic limit adjustment
- Confidence levels for adapted thresholds
- References documentation with official and community sources
- Updated baseline estimates based on community observations

### Planned
- `claude-history` tool for viewing centralized chat histories
- `claude-config` tool for managing configuration settings
- Automatic chat synchronization from Claude Code directory
- Export/import functionality for chat histories
- Automatic usage tracking integration with Claude Code
- Windows support
- Additional OS testing

## [0.1.0] - 2025-01-02

### Added
- Initial release
- Basic project structure
- README with installation instructions
- GPL-3.0 license
- Git repository setup

### Technical Details
- Node.js 18.19.0 selected as the isolated runtime version
- nvm used for Node.js version management
- Gitea repository at git.dev2dev.net
- Case-sensitive repository naming resolved

### Known Issues
- Windows compatibility not tested
- Limited to Debian 12 and macOS testing
- Chat history retrieval not yet implemented