# Live Monitor Field Guide

This guide explains every field in the claude-monitor-live display and how they're calculated.

![Live Monitor Screenshot](../assets/live-monitor-screenshot.png)

## Display Sections

### 1. Current Usage (Top Left)

**Subscription: Max**
- Your current subscription tier (Free, Professional, or Max)
- Determines your daily limits

**Messages: 234/1500 (15.6%)**
- Current count / Daily limit (Percentage)
- Tracks every message sent to Claude in the current period
- Resets based on --reset-hours setting (default: 24)

**Tokens: 1.2M/10.0M (12.0%)**
- Estimated tokens used / Daily limit (Percentage)
- Tokens ≈ characters ÷ 4 (rough estimate)
- Includes both input and output tokens

**Reset in: 4h 32m**
- Time until usage counters reset to zero
- Based on when current period started + reset hours

**Current rate: 20.0 msg/hr**
- **What it means**: Your estimated current usage rate
- **Calculation**: (Active sessions) × 10 messages/hour
- **Example**: 2 sessions × 10 = 20.0 msg/hr
- **Color coding**:
  - Green: Well below safe rate
  - Yellow: Approaching safe rate (>80%)
  - Red: Exceeding safe rate!

**Safe rate: 62.3 msg/hr**
- **What it means**: Maximum messages per hour you can send without exceeding limits
- **Calculation**: (Messages remaining) ÷ (Hours until reset)
- **Example**: (1500 - 234) ÷ 4.53 hours = 279.7 msg/hr
- **Purpose**: Your "speed limit" to avoid hitting limits

**Rate Indicator Bar**
```
Rate: [▓▓▓▓░░░░░░░░░░░░░░░░] SAFE
```
- Visual comparison of current rate vs safe rate
- Bar fills based on ratio: current/safe
- Labels:
  - SAFE (green): Under 80% of safe rate
  - CAUTION (yellow): 80-100% of safe rate
  - EXCEEDING! (red): Over 100% of safe rate

### 2. Active Sessions (Top Right)

**Active: 2 / 7**
- Currently running Claude sessions / Safe concurrent limit
- Each claude-wrapper instance creates a session
- Multiple sessions increase API load

**Today: 5 total**
- Total number of sessions started today
- Helps track overall activity patterns

**Current Sessions:**
- Lists active session PIDs and duration
- Sorted by duration (longest first)
- Shows which sessions are consuming resources

### 3. Combined Usage (Progress Bar)

```
████████░░░░░░░░░░░░░░░░░░ 26.7%
```

- Visual representation of highest usage metric
- Takes MAX of (message %, token %, session %)
- Color coding:
  - Green: 0-69% - Safe zone
  - Yellow: 70-89% - Caution zone
  - Red: 90%+ - Critical zone

### 4. Alerts (Bottom Section)

Real-time warnings with timestamps:

**[10:32:15] ⚠️  WARNING: Usage above 70%**
- Triggered when combined usage exceeds alert threshold
- Default threshold: 70% (adjustable with --alert-threshold)

**[10:45:22] ⚠️  Current rate exceeds safe rate**
- Your current usage rate will exceed limits before reset
- Calculation: (Active sessions × 10 msg/hr) > Safe rate
- Assumes ~10 messages/hour per active session

**[11:15:30] ⚠️  Too many sessions! 8/7**
- Running more concurrent sessions than recommended
- Increases risk of rate limiting

**[11:45:00] ⚠️  CRITICAL: Usage above 90%**
- Very high risk of hitting limits
- Consider stopping work until reset

## Calculations Explained

### Message Percentage
```
(Current messages / Daily limit) × 100
Example: (234 / 1500) × 100 = 15.6%
```

### Token Percentage
```
(Estimated tokens / Daily limit) × 100
Example: (1,200,000 / 10,000,000) × 100 = 12.0%
```

### Current Rate
```
Active sessions × 10 messages/hour per session
Example: 2 sessions × 10 = 20.0 messages/hour
```

### Safe Rate
```
Messages remaining / Hours until reset
Example: (1500 - 234) / 4.53 = 279.7 messages/hour
```

### Rate Ratio (for indicator bar)
```
Current rate / Safe rate
Example: 20.0 / 279.7 = 0.07 (7% - SAFE)
Example: 250.0 / 279.7 = 0.89 (89% - CAUTION)
Example: 300.0 / 279.7 = 1.07 (107% - EXCEEDING!)
```

### Combined Usage
```
MAX(message_percentage, token_percentage, session_percentage)
Example: MAX(15.6%, 12.0%, 28.6%) = 28.6%
```

## Color Coding

- **Green**: Safe to continue working
- **Yellow**: Slow down, monitor closely
- **Red**: Stop non-critical work, wait for reset

## Common Scenarios

### Scenario 1: Early in Period
- Messages: 50/1500 (3.3%)
- Reset in: 20h
- Safe rate: 72.5 msg/hr
- **Meaning**: You can work freely

### Scenario 2: Heavy Usage
- Messages: 1200/1500 (80%)
- Reset in: 3h
- Safe rate: 100 msg/hr
- **Meaning**: Slow down significantly

### Scenario 3: Multiple Sessions
- Active: 5/7 sessions
- Estimated rate: 50 msg/hr
- Safe rate: 45 msg/hr
- **Alert**: Current rate exceeds safe rate!

## Tips for Using the Monitor

1. **Watch the safe rate** - This is your speedometer
2. **Keep sessions low** - Each session adds ~10 msg/hr load
3. **React to yellow** - Don't wait for red alerts
4. **Use --reset-hours 6** - For Max tier aggressive limits
5. **Position monitor visible** - Glance at it regularly

## Command Options

```bash
claude-monitor-live [options]

Options:
  -i, --interval <seconds>      Update interval (default: 5)
  -r, --reset-hours <hours>     Reset period (default: 24, use 6 for aggressive)
  -a, --alert-threshold <percent>  Alert threshold 0-100 (default: 70)
```

## Troubleshooting

**Q: Safe rate seems too high/low**
A: Check your reset period. Use --reset-hours 6 for stricter monitoring.

**Q: No alerts showing**
A: Alerts only trigger once per condition per time period to avoid spam.

**Q: Sessions not updating**
A: Check ~/.claude-centralized/sessions/ for stale session files.