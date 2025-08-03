# Centralized Chat System

## Overview

The Claude Tools centralized chat system helps you:
1. Keep project directories clean of Claude-related files
2. Centralize all chat histories in your home directory
3. Search and retrieve past conversations easily

## How It Works

### Storage Locations

Chat histories are stored in two possible locations:
- `~/.claude-clean/conversations/` - Primary location used by our tools
- `~/.claude-centralized/conversations/` - Alternative location (configurable)

### Directory Structure

```
~/.claude-clean/
└── conversations/
    ├── 8980bb8b8f8f4323/          # Conversation ID
    │   └── metadata.json           # Project info and timestamp
    └── b7bb0cb178f95465/
        └── metadata.json
```

### Metadata Format

Each conversation has a `metadata.json` file:
```json
{
    "original_path": "~/Documents/Dev2Dev/Development/AI/project-name",
    "claude_project_name": "project-identifier",
    "created": "2025-08-02T12:48:30-07:00",
    "project_id": "8980bb8b8f8f4323"
}
```

## Integration with Claude Code

When you use Claude Code in a project directory:
1. Claude creates files in your project (`.claude`, etc.)
2. Our tools detect these and can move them to centralized storage
3. A symlink is created from the project to the centralized location
4. Your project stays clean while history remains accessible

## Using claude-history

### List All Conversations
```bash
claude-history list
```

### Filter by Project
```bash
claude-history list --project ~/Documents/MyProject
```

### Show Specific Conversation
```bash
claude-history show 8980bb8b8f8f4323
```

### Search Conversations
```bash
claude-history search "keyword"
```

### View Statistics
```bash
claude-history stats
```

## Configuration

Use `claude-config` to manage storage paths:

```bash
# View current paths
claude-config paths

# Change central storage location
claude-config storage-path ~/my-claude-chats
```

## Automatic Cleanup

When using `claude-clean`:
- Removes Claude artifacts from projects
- Optionally moves them to centralized storage (future feature)
- Maintains project cleanliness

## Benefits

1. **Clean Git Repos**: No accidental commits of Claude files
2. **Centralized Access**: All conversations in one place
3. **Cross-Project Search**: Find that solution from last week
4. **Storage Management**: Monitor and manage disk usage
5. **Privacy**: Keep AI conversations separate from project code