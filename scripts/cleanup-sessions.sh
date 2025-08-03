#!/bin/bash

# cleanup-sessions.sh
# Emergency script to clean up session files

SESSION_DIR="${CLAUDE_CENTRAL_STORAGE:-$HOME/.claude-centralized}/sessions"

if [ -d "$SESSION_DIR" ]; then
    echo "Cleaning up session files in: $SESSION_DIR"
    
    # Count files before
    count_before=$(find "$SESSION_DIR" -name "session-*.json" 2>/dev/null | wc -l)
    echo "Found $count_before session files"
    
    # Remove all session files
    find "$SESSION_DIR" -name "session-*.json" -delete 2>/dev/null
    
    echo "Session files cleaned up"
else
    echo "No session directory found at: $SESSION_DIR"
fi

# Also clean up any throttle events that might have been created
THROTTLE_DIR="${CLAUDE_CENTRAL_STORAGE:-$HOME/.claude-centralized}/throttle-events"
if [ -d "$THROTTLE_DIR" ]; then
    echo "Cleaning up throttle event files..."
    find "$THROTTLE_DIR" -name "throttle-*.json" -delete 2>/dev/null
fi

echo "Cleanup complete"