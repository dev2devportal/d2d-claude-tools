# Frequently Asked Questions

## General Questions

### Q: Why do I need this tool?

**A:** This tool solves two main problems:
1. Prevents Claude-related files from being accidentally committed to your git repositories
2. Centralizes Claude Code chat histories by user rather than scattered across project directories

### Q: Will this interfere with my existing Node.js projects?

**A:** No. The tool uses nvm to maintain a completely isolated Node.js environment. Your system Node.js and other project-specific Node versions remain untouched.

### Q: What operating systems are supported?

**A:** Currently tested on:
- Linux: Debian 12 (Q4OS with Trinity Desktop Environment)
- macOS

Windows support is not available at this time.

## Installation Questions

### Q: Do I need to install Node.js first?

**A:** No. The setup script will install nvm and a dedicated Node.js version (18.19.0) specifically for Claude tools.

### Q: Can I use this with my existing nvm installation?

**A:** Yes. If nvm is already installed, the setup script will use it and just add the Claude-specific Node version.

### Q: Do I need sudo/administrator access?

**A:** No. Everything installs in your user directory. No system-wide changes are made.

## Usage Questions

### Q: How do I know if I'm in the Claude environment?

**A:** When you run `./claude-env`, your shell prompt will be prefixed with `[claude-env]`. You can also run `echo $CLAUDE_TOOLS_HOME` to verify.

### Q: Can I use this with VS Code instead of VSCodium?

**A:** Yes. Use `./claude-env code` instead of `./claude-env codium`.

### Q: What files does claude-clean remove?

**A:** It removes:
- `.claude` directories
- `.claude-code` directories
- `claude-code` directories
- Any files matching `*.claude*`
- `CLAUDE.md` files

### Q: Is claude-clean safe to use?

**A:** Yes. It has several safety features:
- Dry-run mode (`-d`) shows what would be removed without removing
- Only removes specific Claude-related patterns
- Never removes files outside the target directory (unless using `-r`)

## Technical Questions

### Q: How does the Node.js isolation work?

**A:** The `claude-env` script:
1. Sources nvm to enable Node version management
2. Switches to a dedicated Node.js version (18.19.0)
3. Modifies PATH to include claude-tools binaries
4. Launches your command in this modified environment

### Q: Where are centralized chats stored?

**A:** By default in `~/.claude-centralized/`. You can change this by setting the `CLAUDE_CENTRAL_STORAGE` environment variable.

### Q: Can I integrate this with git hooks?

**A:** Yes. See the Advanced Usage section in the Usage Guide for examples of pre-commit hooks.

### Q: Why Node.js instead of Python?

**A:** Claude Code itself uses Node.js and stores data in JSON format. Using Node.js allows direct integration with Claude Code's infrastructure.

## Troubleshooting Questions

### Q: I get "command not found" errors

**A:** Make sure you're running commands from within the claude-tools directory or using the full path to `claude-env`.

### Q: The Node version isn't switching

**A:** Try:
1. Close and reopen your terminal
2. Run `source ~/.bashrc` (or `~/.zshrc`)
3. Check if nvm is working: `nvm --version`

### Q: I can't push to the git repository

**A:** The repository URL is case-sensitive. Make sure you're using:
```
https://git.dev2dev.net/Dev2Dev/claude-tools.git
```
Note the capital 'D' in 'Dev2Dev'.

### Q: claude-clean isn't finding all Claude files

**A:** Make sure to use the `-r` flag for recursive searching:
```bash
claude-clean -r
```

## Development Questions

### Q: How can I contribute?

**A:** See CONTRIBUTING.md for guidelines. The project follows:
- Clear, descriptive code comments
- Single responsibility principles
- User-directory focused operations

### Q: Can I add new cleaning patterns?

**A:** Yes. Edit the `CLAUDE_PATTERNS` array in `bin/claude-clean.js`. Submit a pull request with your additions.

### Q: How does claude-usage-monitor help prevent downgrades?

**A:** The usage monitor:
- Tracks your daily message count
- Warns you when approaching limits (70% for Max users)
- Shows time until the 24-hour reset
- Recommends a safe usage rate to stay under limits
- Helps you avoid the "top 5%" threshold that triggers downgrades

### Q: Are the usage limits accurate?

**A:** Claude hasn't published exact limits, especially for the "top 5%" threshold. The tool uses estimates based on community reports from multiple sources (see [References](REFERENCES.md)):

**Message Limits (community observed ranges):**
- Free: 30-50 messages/day (we use 40)
- Pro: 300-500 messages/day (we use 400)
- Max: 1000-2000 messages/day (we use 1500)

**Token Limits (estimated based on usage patterns):**
- Free: 150K tokens/day
- Pro: 2M tokens/day
- Max: 10M tokens/day

**Concurrent Session Limits (community observed):**
- Free: 1-2 sessions (we use 1)
- Pro: 3-5 sessions (we use 4)
- Max: 5-10 sessions (we use 7)

The actual limits appear to be a complex algorithm considering:
- Message count
- Token usage (input + output)
- Concurrent sessions
- Time-based rate limiting
- Overall compute resources

You can adjust these by modifying `SUBSCRIPTION_TIERS` in `bin/claude-usage-monitor.js`.

### Q: How does concurrent session tracking work?

**A:** When you use the `claude` command wrapper:
1. Each session creates a tracking file with PID and start time
2. The wrapper monitors claude process output to estimate tokens
3. Session files are marked inactive when the process ends
4. The monitor checks all active sessions and warns if too many

This helps identify when multiple concurrent sessions might trigger downgrades.

### Q: How does the adaptive threshold learning work?

**A:** The system learns from actual throttle events:

1. **Detection**: The `claude` wrapper monitors output for throttle messages like:
   - "You've reached your usage limit"
   - "switching to a different model" 
   - "rate limit"
   - "too many requests"

2. **Logging**: When detected, it captures:
   - Current message count
   - Estimated token count
   - Active concurrent sessions
   - Time into the 24-hour period

3. **Analysis**: After 3+ events, the system:
   - Calculates the lowest throttle point for each metric
   - Sets new limits at 90% of that point (conservative)
   - Switches from [ESTIMATED] to [ADAPTED] mode

4. **Continuous Learning**: Limits adjust dynamically as more throttle events occur, adapting to Claude's changing policies.

### Q: What happens when I get throttled?

**A:** When throttling is detected:
1. A red warning appears: "⚠️ THROTTLE EVENT DETECTED AND LOGGED!"
2. All current usage metrics are saved to `~/.claude-centralized/throttle-events/`
3. The system runs threshold analysis
4. Future limits may be adjusted based on this data
5. You'll see updated limits next time you check status

### Q: Is there a roadmap?

**A:** Current features:
- ✓ `claude-clean`: Remove Claude artifacts
- ✓ `claude-usage-monitor`: Track usage and prevent downgrades

Planned features:
- `claude-history`: View centralized chat histories
- `claude-config`: Manage configuration settings
- Automatic chat synchronization
- Export/import functionality
- Automatic usage tracking integration with Claude Code

## Privacy & Security Questions

### Q: Does this tool send data anywhere?

**A:** No. All operations are local to your machine. No data is sent to external servers.

### Q: Are my chat histories secure?

**A:** Chat histories are stored in your user directory with standard file permissions. They're as secure as any other files in your home directory.

### Q: Can others see my Claude usage?

**A:** After running `claude-clean`, no Claude artifacts remain in your project directories. The centralized storage is in your user directory, accessible only to you.