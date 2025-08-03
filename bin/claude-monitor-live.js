#!/usr/bin/env node

/**
 * claude-monitor-live.js
 * 
 * Real-time usage monitor that runs in a separate terminal
 * Shows live updates of Claude usage to prevent mid-session downgrades
 */

const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');

// Check if blessed is available
let blessed;
try {
    blessed = require('blessed');
} catch (error) {
    console.error(chalk.red('Error: blessed package not installed'));
    console.log('Please run: npm install blessed');
    process.exit(1);
}

// Usage tracking file location
const USAGE_FILE = path.join(
    process.env.CLAUDE_CENTRAL_STORAGE || path.join(os.homedir(), '.claude-centralized'),
    'usage-tracking.json'
);

// Session directory
const SESSION_DIR = path.join(
    process.env.CLAUDE_CENTRAL_STORAGE || path.join(os.homedir(), '.claude-centralized'),
    'sessions'
);

// Note: Subscription tiers are defined inline in getTier() method

class LiveMonitor {
    constructor(options = {}) {
        this.refreshInterval = options.interval || 5000; // 5 seconds default
        this.resetHours = options.resetHours || 24; // Allow override for reset period
        this.screen = null;
        this.boxes = {};
        this.lastStats = {};
        this.alertThreshold = options.alertThreshold || 0.7; // Alert at 70% by default
    }

    async start() {
        // Create blessed screen
        this.screen = blessed.screen({
            smartCSR: true,
            title: 'Claude Usage Monitor - Live'
        });

        // Create UI layout
        this.createUI();

        // Set up refresh interval
        this.refreshTimer = setInterval(() => this.updateDisplay(), this.refreshInterval);

        // Initial update
        await this.updateDisplay();

        // Handle exit
        this.screen.key(['q', 'C-c'], () => {
            clearInterval(this.refreshTimer);
            return process.exit(0);
        });

        // Render
        this.screen.render();
    }

    createUI() {
        // Main container
        const container = blessed.box({
            parent: this.screen,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'cyan'
                }
            }
        });

        // Title
        this.boxes.title = blessed.text({
            parent: container,
            top: 0,
            left: 'center',
            content: ' Claude Usage Monitor - Live ',
            style: {
                fg: 'white',
                bold: true
            }
        });

        // Usage stats box
        this.boxes.usage = blessed.box({
            parent: container,
            label: ' Current Usage ',
            top: 2,
            left: 2,
            width: '50%-4',
            height: 12,
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'green'
                }
            },
            tags: true
        });

        // Sessions box
        this.boxes.sessions = blessed.box({
            parent: container,
            label: ' Active Sessions ',
            top: 2,
            right: 2,
            width: '50%-4',
            height: 12,
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'blue'
                }
            },
            tags: true
        });

        // Progress bar
        this.boxes.progress = blessed.progressbar({
            parent: container,
            label: ' Combined Usage ',
            top: 15,
            left: 2,
            right: 2,
            height: 3,
            border: {
                type: 'line'
            },
            style: {
                bar: {
                    bg: 'green'
                },
                border: {
                    fg: 'white'
                }
            },
            ch: '█',
            filled: 0
        });

        // Alerts box
        this.boxes.alerts = blessed.box({
            parent: container,
            label: ' Alerts ',
            bottom: 2,
            left: 2,
            right: 2,
            height: 8,
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'yellow'
                }
            },
            tags: true,
            scrollable: true,
            alwaysScroll: true,
            mouse: true
        });

        // Help text
        this.boxes.help = blessed.text({
            parent: container,
            bottom: 0,
            left: 'center',
            content: ' Press q to quit | Updates every ' + (this.refreshInterval/1000) + 's ',
            style: {
                fg: 'gray'
            }
        });
    }

    async updateDisplay() {
        try {
            // Load current usage data
            const usageData = await this.loadUsageData();
            const sessionStats = await this.getSessionStats();
            const tier = this.getTier(usageData.subscription);

            // Calculate usage percentages
            const messagePercentage = (usageData.currentPeriod.messageCount / tier.dailyMessages) * 100;
            const tokenPercentage = (usageData.currentPeriod.tokenCount / tier.dailyTokens) * 100;
            const sessionPercentage = (sessionStats.activeSessions / tier.concurrentSessions) * 100;
            const combinedPercentage = Math.max(messagePercentage, tokenPercentage, sessionPercentage);

            // Calculate rates
            const safeRate = parseFloat(this.getSafeRate(usageData, tier));
            const currentRate = sessionStats.activeSessions * 10; // Estimate 10 msg/hr per session
            const rateRatio = safeRate > 0 ? (currentRate / safeRate) : 0;
            
            // Create rate indicator
            let rateIndicator = '';
            let rateColor = 'green-fg';
            if (rateRatio > 1.0) {
                rateColor = 'red-fg';
                rateIndicator = this.createRateBar(rateRatio, 'red');
            } else if (rateRatio > 0.8) {
                rateColor = 'yellow-fg';
                rateIndicator = this.createRateBar(rateRatio, 'yellow');
            } else {
                rateIndicator = this.createRateBar(rateRatio, 'green');
            }
            
            // Update usage box
            const usageContent = [
                `{bold}Subscription:{/bold} ${tier.name}`,
                '',
                `{bold}Messages:{/bold} ${usageData.currentPeriod.messageCount} / ${tier.dailyMessages} ({yellow-fg}${messagePercentage.toFixed(1)}%{/yellow-fg})`,
                `{bold}Tokens:{/bold} ${this.formatTokens(usageData.currentPeriod.tokenCount)} / ${this.formatTokens(tier.dailyTokens)} ({yellow-fg}${tokenPercentage.toFixed(1)}%{/yellow-fg})`,
                '',
                `{bold}Reset in:{/bold} {cyan-fg}${this.getTimeUntilReset(usageData.currentPeriod.startDate)}{/cyan-fg}`,
                '',
                `{bold}Current rate:{/bold} {${rateColor}}${currentRate.toFixed(1)} msg/hr{/${rateColor}}`,
                `{bold}Safe rate:{/bold} ${safeRate.toFixed(1)} msg/hr`,
                rateIndicator
            ].join('\n');
            this.boxes.usage.setContent(usageContent);

            // Update sessions box
            const sessionContent = [
                `{bold}Active:{/bold} ${sessionStats.activeSessions} / ${tier.concurrentSessions}`,
                `{bold}Today:{/bold} ${sessionStats.todaySessions} total`,
                '',
                '{bold}Current Sessions:{/bold}',
                ...sessionStats.sessions.slice(0, 4).map(s => 
                    `  • ${s.pid} - ${this.formatDuration(s.duration)}`
                )
            ].join('\n');
            this.boxes.sessions.setContent(sessionContent);

            // Update progress bar
            this.boxes.progress.setProgress(combinedPercentage);
            
            // Update bar color based on percentage
            if (combinedPercentage >= 90) {
                this.boxes.progress.style.bar.bg = 'red';
                this.boxes.progress.style.border.fg = 'red';
            } else if (combinedPercentage >= 70) {
                this.boxes.progress.style.bar.bg = 'yellow';
                this.boxes.progress.style.border.fg = 'yellow';
            } else {
                this.boxes.progress.style.bar.bg = 'green';
                this.boxes.progress.style.border.fg = 'green';
            }

            // Check for alerts
            this.checkAlerts(combinedPercentage, messagePercentage, tokenPercentage, sessionStats, tier);

            // Force screen render
            this.screen.render();

        } catch (error) {
            this.addAlert(`Error updating display: ${error.message}`, 'red');
        }
    }

    checkAlerts(combined, messages, tokens, sessions, tier) {
        const now = Date.now();

        // Combined usage alert
        if (combined >= 90 && (!this.lastStats.criticalAlert || now - this.lastStats.criticalAlert > 300000)) {
            this.addAlert('⚠️  CRITICAL: Usage above 90%! Risk of immediate downgrade!', 'red');
            this.lastStats.criticalAlert = now;
        } else if (combined >= 70 && (!this.lastStats.warningAlert || now - this.lastStats.warningAlert > 600000)) {
            this.addAlert('⚠️  WARNING: Usage above 70%. Slow down to avoid downgrade.', 'yellow');
            this.lastStats.warningAlert = now;
        }

        // Concurrent sessions alert
        if (sessions.activeSessions > tier.concurrentSessions) {
            if (!this.lastStats.sessionAlert || now - this.lastStats.sessionAlert > 60000) {
                this.addAlert(`⚠️  Too many sessions! ${sessions.activeSessions}/${tier.concurrentSessions}`, 'red');
                this.lastStats.sessionAlert = now;
            }
        }

        // Rate alert
        const hoursLeft = this.getHoursUntilReset(this.lastUsageData?.currentPeriod?.startDate);
        const messagesLeft = tier.dailyMessages - (this.lastUsageData?.currentPeriod?.messageCount || 0);
        const currentRate = sessions.activeSessions * 10; // Estimate 10 messages/hour per session

        if (hoursLeft > 0 && currentRate > (messagesLeft / hoursLeft)) {
            if (!this.lastStats.rateAlert || now - this.lastStats.rateAlert > 300000) {
                this.addAlert(`⚠️  Current rate (${currentRate.toFixed(1)} msg/hr) exceeds safe rate!`, 'yellow');
                this.lastStats.rateAlert = now;
            }
        }
    }

    addAlert(message, color = 'white') {
        const timestamp = new Date().toLocaleTimeString();
        const content = this.boxes.alerts.getContent();
        const newLine = `{${color}-fg}[${timestamp}] ${message}{/${color}-fg}`;
        
        // Keep last 50 lines
        const lines = content.split('\n').filter(l => l.trim());
        lines.push(newLine);
        if (lines.length > 50) lines.shift();
        
        this.boxes.alerts.setContent(lines.join('\n'));
        this.boxes.alerts.setScrollPerc(100);
    }

    async loadUsageData() {
        try {
            if (await fs.pathExists(USAGE_FILE)) {
                this.lastUsageData = await fs.readJson(USAGE_FILE);
                return this.lastUsageData;
            }
        } catch (error) {
            this.addAlert(`Error loading usage data: ${error.message}`, 'red');
        }
        return {
            subscription: 'max',
            currentPeriod: {
                startDate: new Date().toISOString(),
                messageCount: 0,
                tokenCount: 0
            }
        };
    }

    async getSessionStats() {
        const stats = {
            activeSessions: 0,
            todaySessions: 0,
            sessions: []
        };

        try {
            if (!await fs.pathExists(SESSION_DIR)) return stats;

            const files = await fs.readdir(SESSION_DIR);
            const now = Date.now();
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            for (const file of files) {
                if (file.startsWith('session-') && file.endsWith('.json')) {
                    try {
                        const sessionData = await fs.readJson(path.join(SESSION_DIR, file));
                        const startTime = new Date(sessionData.startTime);
                        
                        if (startTime >= todayStart) {
                            stats.todaySessions++;
                        }

                        if (sessionData.active) {
                            stats.activeSessions++;
                            stats.sessions.push({
                                pid: sessionData.pid,
                                duration: now - startTime.getTime()
                            });
                        }
                    } catch (error) {
                        // Skip invalid session files
                    }
                }
            }

            // Sort by duration
            stats.sessions.sort((a, b) => b.duration - a.duration);

        } catch (error) {
            this.addAlert(`Error reading sessions: ${error.message}`, 'red');
        }

        return stats;
    }

    getTier(subscription) {
        // Import default tiers or define them
        const tiers = {
            free: {
                name: 'Free',
                dailyMessages: 40,
                dailyTokens: 150000,
                concurrentSessions: 1
            },
            pro: {
                name: 'Professional',
                dailyMessages: 400,
                dailyTokens: 2000000,
                concurrentSessions: 4
            },
            max: {
                name: 'Max',
                dailyMessages: 1500,
                dailyTokens: 10000000,
                concurrentSessions: 7
            }
        };
        return tiers[subscription] || tiers.max;
    }

    getTimeUntilReset(startDate) {
        const start = new Date(startDate);
        const resetTime = new Date(start.getTime() + this.resetHours * 60 * 60 * 1000);
        const now = new Date();
        const hoursLeft = Math.max(0, (resetTime - now) / (1000 * 60 * 60));
        
        const hours = Math.floor(hoursLeft);
        const minutes = Math.round((hoursLeft - hours) * 60);
        
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    getHoursUntilReset(startDate) {
        const start = new Date(startDate);
        const resetTime = new Date(start.getTime() + this.resetHours * 60 * 60 * 1000);
        const now = new Date();
        return Math.max(0, (resetTime - now) / (1000 * 60 * 60));
    }

    getSafeRate(usageData, tier) {
        const messagesLeft = tier.dailyMessages - usageData.currentPeriod.messageCount;
        const hoursLeft = this.getHoursUntilReset(usageData.currentPeriod.startDate);
        
        if (hoursLeft <= 0) return 0;
        return (messagesLeft / hoursLeft).toFixed(1);
    }

    formatTokens(count) {
        if (count > 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count > 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }
    
    createRateBar(ratio, color) {
        const barWidth = 20;
        const filledWidth = Math.min(barWidth, Math.round(ratio * barWidth));
        const emptyWidth = barWidth - filledWidth;
        
        let bar = '';
        if (color === 'red') {
            bar = `{red-fg}${'▓'.repeat(filledWidth)}{/red-fg}`;
        } else if (color === 'yellow') {
            bar = `{yellow-fg}${'▓'.repeat(filledWidth)}{/yellow-fg}`;
        } else {
            bar = `{green-fg}${'▓'.repeat(filledWidth)}{/green-fg}`;
        }
        bar += `{gray-fg}${'░'.repeat(emptyWidth)}{/gray-fg}`;
        
        let label = '';
        if (ratio > 1.0) {
            label = ` {red-fg}EXCEEDING!{/red-fg}`;
        } else if (ratio > 0.8) {
            label = ` {yellow-fg}CAUTION{/yellow-fg}`;
        } else {
            label = ` {green-fg}SAFE{/green-fg}`;
        }
        
        return `Rate: [${bar}]${label}`;
    }
}

// CLI setup
program
    .name('claude-monitor-live')
    .description('Real-time Claude usage monitor')
    .version('1.0.0')
    .option('-i, --interval <seconds>', 'Update interval in seconds', '5')
    .option('-r, --reset-hours <hours>', 'Reset period in hours (default: 24, use 6 for aggressive limits)', '24')
    .option('-a, --alert-threshold <percent>', 'Alert threshold percentage (0-100)', '70')
    .parse(process.argv);

// Get options
const options = program.opts();

// Start the monitor
const monitor = new LiveMonitor({
    interval: parseInt(options.interval) * 1000,
    resetHours: parseFloat(options.resetHours),
    alertThreshold: parseFloat(options.alertThreshold) / 100
});

console.log(chalk.blue('Starting Claude Live Monitor...'));
console.log(chalk.gray(`Reset period: ${options.resetHours} hours`));
console.log(chalk.gray(`Update interval: ${options.interval} seconds`));
console.log(chalk.gray(`Alert threshold: ${options.alertThreshold}%\n`));

// Wait a moment for the message to be read
setTimeout(() => monitor.start(), 1500);