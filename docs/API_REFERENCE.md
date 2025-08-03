# API Reference

## ClaudeCleaner Class

Located in: `./bin/claude-clean.js`

### Constructor

```javascript
new ClaudeCleaner(options)
```

**Parameters:**
- `options` (Object):
  - `recursive` (Boolean): Clean subdirectories recursively. Default: `false`
  - `dryRun` (Boolean): Show what would be removed without removing. Default: `false`
  - `verbose` (Boolean): Show detailed output. Default: `false`

### Methods

#### findClaudeFiles(targetDir)

Searches for Claude-related files in the specified directory.

**Parameters:**
- `targetDir` (String): The directory path to search

**Returns:**
- `Promise<Array<String>>`: Array of absolute paths to Claude-related files

**Patterns Searched:**
- `.claude`
- `.claude-code`
- `claude-code`
- `**/.claude`
- `**/.claude-code`
- `**/claude-code`
- `**/*.claude*`
- `**/CLAUDE.md`

#### cleanFiles()

Removes the files found by `findClaudeFiles()`.

**Returns:**
- `Promise<void>`

**Behavior:**
- Logs each file to be removed
- In dry-run mode, only logs without removing
- Handles errors gracefully per file

#### run(targetDir)

Main execution method that combines finding and cleaning.

**Parameters:**
- `targetDir` (String): The directory to clean

**Returns:**
- `Promise<void>`

**Process:**
1. Validates directory exists
2. Finds Claude files
3. Cleans found files
4. Reports completion

### Usage Example

```javascript
const { ClaudeCleaner } = require('./bin/claude-clean');

// Create instance with options
const cleaner = new ClaudeCleaner({
    recursive: true,
    dryRun: false,
    verbose: true
});

// Run the cleaner
await cleaner.run('/path/to/project');
```

## Environment Variables

### CLAUDE_TOOLS_HOME

Set by `claude-env` script.

**Purpose:** Path to the claude-tools installation directory

**Example:**
```bash
echo $CLAUDE_TOOLS_HOME
# Output: /home/user/claude-tools
```

### CLAUDE_CENTRAL_STORAGE

Set by `claude-env` script.

**Purpose:** Path to centralized chat storage location

**Default:** `~/.claude-centralized`

**Example:**
```bash
export CLAUDE_CENTRAL_STORAGE="$HOME/Documents/claude-chats"
```

### NVM_DIR

Used by nvm for Node.js version management.

**Purpose:** Path to nvm installation

**Default:** `~/.nvm`

## Command Line Interface

### claude-clean

**Usage:**
```
claude-clean [options] [directory]
```

**Arguments:**
- `directory`: Target directory to clean (default: current directory)

**Options:**
- `-r, --recursive`: Clean recursively in subdirectories
- `-d, --dry-run`: Show what would be removed without actually removing
- `-v, --verbose`: Show detailed output
- `-V, --version`: Display version number
- `-h, --help`: Display help information

**Exit Codes:**
- `0`: Success
- `1`: Error (e.g., directory not found)

### claude-env

**Usage:**
```
claude-env [command] [arguments...]
```

**Commands:**
- No command or `bash`: Start interactive bash shell
- `codium [path]`: Launch VSCodium
- `code [path]`: Launch VS Code
- Any other command: Execute in Claude environment

**Environment Setup:**
1. Sources nvm
2. Switches to claude-tools Node version
3. Adds claude-tools/bin to PATH
4. Sets CLAUDE_TOOLS_HOME
5. Sets CLAUDE_CENTRAL_STORAGE
6. Creates storage directory if needed

**Shell Prompt:**
When entering interactive shell, prompt is prefixed with `[claude-env]`

## File Patterns

### Glob Patterns

The following glob patterns are used to identify Claude-related files:

```javascript
const CLAUDE_PATTERNS = [
    '.claude',           // Hidden claude directory
    '.claude-code',      // Hidden claude-code directory
    'claude-code',       // Non-hidden claude-code directory
    '**/.claude',        // Any .claude in subdirectories
    '**/.claude-code',   // Any .claude-code in subdirectories
    '**/claude-code',    // Any claude-code in subdirectories
    '**/*.claude*',      // Any file with .claude in name
    '**/CLAUDE.md'       // CLAUDE.md documentation files
];
```

### Pattern Matching Behavior

- Uses `glob` package with options:
  - `dot: true`: Matches hidden files
  - `absolute: true`: Returns absolute paths
- Removes duplicate matches
- Handles permission errors gracefully

## Error Handling

### Error Types

1. **Directory Not Found**
   - Exit code: 1
   - Message: "Error: Directory [path] does not exist."

2. **Permission Denied**
   - Logged as warning in verbose mode
   - Continues with other files

3. **File Removal Failed**
   - Logged with red color
   - Shows specific error message
   - Continues with other files

### Error Message Format

```
✗ Failed: [error message]
```

Success messages use:
```
✓ Removed
```

## Future API Additions

### Planned: ChatHistory Class

```javascript
class ChatHistory {
    constructor(storagePath)
    async findChats(options)
    async exportChat(chatId, format)
    async importChat(filePath)
}
```

### Planned: ConfigManager Class

```javascript
class ConfigManager {
    constructor(configPath)
    get(key)
    set(key, value)
    list()
    reset()
}
```

### Planned: ChatMonitor Class

```javascript
class ChatMonitor {
    constructor(sourcePath, targetPath)
    watch()
    sync()
    archive()
}
```