#!/usr/bin/env node

/**
 * claude-usage-monitor.js
 * 
 * This tool tracks Claude API usage to help users avoid downgrades
 * when approaching usage limits. It monitors message counts and 
 * provides warnings based on subscription tier.
 */

const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');

// Usage tracking file location
const USAGE_FILE = path.join(
    process.env.CLAUDE_CENTRAL_STORAGE || path.join(os.homedir(), '.claude-centralized'),
    'usage-tracking.json'
);

// Default subscription tier limits - INITIAL ESTIMATES ONLY
// Based on community observations from various sources (see docs/REFERENCES.md)
// These will be refined based on actual throttle events
const DEFAULT_SUBSCRIPTION_TIERS = {
    free: {
        name: 'Free',
        dailyMessages: 40,      // Community reports: 30-50/day
        dailyTokens: 150000,    // Estimated based on typical usage
        concurrentSessions: 1,   // Conservative limit
        warningThreshold: 0.8,   // Warn at 80% usage
        criticalThreshold: 0.9   // Critical at 90% usage
    },
    pro: {
        name: 'Professional', 
        dailyMessages: 400,      // Community reports: 300-500/day
        dailyTokens: 2000000,    // Estimated ~5x free tier
        concurrentSessions: 4,    // Community reports: 3-5 tolerated
        warningThreshold: 0.8,
        criticalThreshold: 0.9
    },
    max: {
        name: 'Max',
        dailyMessages: 1500,     // Community reports: 1000-2000 before "top 5%"
        dailyTokens: 10000000,   // Estimated for heavy use
        concurrentSessions: 7,    // Community reports: 5-10 possible
        warningThreshold: 0.7,    // Earlier warning for Max users
        criticalThreshold: 0.85
    }
};

class UsageMonitor {
    constructor() {
        this.usageData = this.loadUsageData();
        this.thresholdData = this.loadThresholdData();
    }

    /**
     * This method attempts to load existing usage data or create new
     */
    loadUsageData() {
        try {
            if (fs.existsSync(USAGE_FILE)) {
                return fs.readJsonSync(USAGE_FILE);
            }
        } catch (error) {
            console.error(chalk.yellow('Warning: Could not load usage data:', error.message));
        }

        // Default usage data structure
        return {
            subscription: 'max',  // Default to max for your case
            currentPeriod: {
                startDate: new Date().toISOString(),
                messageCount: 0,
                tokenCount: 0,
                sessionCount: 0,
                peakConcurrentSessions: 0,
                lastUpdated: new Date().toISOString()
            },
            history: []
        };
    }

    /**
     * Load threshold learning data
     */
    loadThresholdData() {
        const thresholdFile = path.join(
            path.dirname(USAGE_FILE),
            'threshold-learning.json'
        );
        
        try {
            if (fs.existsSync(thresholdFile)) {
                return fs.readJsonSync(thresholdFile);
            }
        } catch (error) {
            console.error(chalk.yellow('Warning: Could not load threshold data:', error.message));
        }
        
        // Default threshold data structure
        return {
            learningMode: 'estimates',  // 'estimates' or 'adaptive'
            lastUpdated: new Date().toISOString(),
            throttleEvents: [],
            adaptedLimits: {},
            confidence: {
                messages: 0,
                tokens: 0,
                sessions: 0
            }
        };
    }
    
    /**
     * Save threshold data
     */
    saveThresholdData() {
        const thresholdFile = path.join(
            path.dirname(USAGE_FILE),
            'threshold-learning.json'
        );
        
        try {
            fs.writeJsonSync(thresholdFile, this.thresholdData, { spaces: 2 });
        } catch (error) {
            console.error(chalk.red('Error saving threshold data:', error.message));
        }
    }
    
    /**
     * Get current subscription limits (adapted or default)
     */
    getCurrentLimits() {
        const subscription = this.usageData.subscription;
        const defaultLimits = DEFAULT_SUBSCRIPTION_TIERS[subscription];
        
        // If we have adapted limits with confidence, use them
        if (this.thresholdData.learningMode === 'adaptive' && 
            this.thresholdData.adaptedLimits[subscription]) {
            return {
                ...defaultLimits,
                ...this.thresholdData.adaptedLimits[subscription],
                isAdapted: true
            };
        }
        
        return {
            ...defaultLimits,
            isAdapted: false
        };
    }

    /**
     * This method saves usage data to disk
     */
    saveUsageData() {
        try {
            fs.ensureDirSync(path.dirname(USAGE_FILE));
            fs.writeJsonSync(USAGE_FILE, this.usageData, { spaces: 2 });
        } catch (error) {
            console.error(chalk.red('Error saving usage data:', error.message));
        }
    }

    /**
     * Check if we need to reset the daily counter
     */
    checkAndResetPeriod() {
        const now = new Date();
        const periodStart = new Date(this.usageData.currentPeriod.startDate);
        
        // Reset if it's been 24 hours
        const hoursSinceStart = (now - periodStart) / (1000 * 60 * 60);
        if (hoursSinceStart >= 24) {
            // Archive current period
            this.usageData.history.push({
                ...this.usageData.currentPeriod,
                endDate: now.toISOString()
            });
            
            // Start new period
            this.usageData.currentPeriod = {
                startDate: now.toISOString(),
                messageCount: 0,
                tokenCount: 0,
                sessionCount: 0,
                peakConcurrentSessions: 0,
                lastUpdated: now.toISOString()
            };
            
            this.saveUsageData();
            return true;
        }
        return false;
    }

    /**
     * Record a new message
     */
    recordMessage(count = 1) {
        this.checkAndResetPeriod();
        
        this.usageData.currentPeriod.messageCount += count;
        this.usageData.currentPeriod.lastUpdated = new Date().toISOString();
        
        this.saveUsageData();
        this.displayStatus();
    }

    /**
     * Process session files to update usage
     */
    async processSessions() {
        const sessionDir = path.join(
            process.env.CLAUDE_CENTRAL_STORAGE || path.join(os.homedir(), '.claude-centralized'),
            'sessions'
        );
        
        if (!await fs.pathExists(sessionDir)) {
            return;
        }
        
        // Read all session files
        const sessionFiles = await fs.readdir(sessionDir);
        let activeSessions = 0;
        let totalTokens = 0;
        let totalMessages = 0;
        
        for (const file of sessionFiles) {
            if (file.startsWith('session-') && file.endsWith('.json')) {
                try {
                    const sessionData = await fs.readJson(path.join(sessionDir, file));
                    const sessionStart = new Date(sessionData.startTime);
                    const periodStart = new Date(this.usageData.currentPeriod.startDate);
                    
                    // Only count sessions from current period
                    if (sessionStart >= periodStart) {
                        totalTokens += sessionData.estimatedTokens || 0;
                        totalMessages += sessionData.messageCount || 0;
                        
                        if (sessionData.active) {
                            activeSessions++;
                        }
                    }
                } catch (error) {
                    // Skip invalid session files
                }
            }
        }
        
        // Update usage data
        this.usageData.currentPeriod.tokenCount = totalTokens;
        this.usageData.currentPeriod.sessionCount = sessionFiles.length;
        this.usageData.currentPeriod.peakConcurrentSessions = Math.max(
            this.usageData.currentPeriod.peakConcurrentSessions,
            activeSessions
        );
        
        this.saveUsageData();
        return { activeSessions, totalTokens, totalMessages };
    }

    /**
     * Display current usage status
     */
    async displayStatus() {
        // Process sessions first to get latest data
        const sessionInfo = await this.processSessions();
        
        const tier = this.getCurrentLimits();
        const usage = this.usageData.currentPeriod.messageCount;
        const tokenUsage = this.usageData.currentPeriod.tokenCount;
        const limit = tier.dailyMessages;
        const tokenLimit = tier.dailyTokens;
        const messagePercentage = (usage / limit) * 100;
        const tokenPercentage = (tokenUsage / tokenLimit) * 100;
        
        // Use the higher percentage for warnings
        const percentage = Math.max(messagePercentage, tokenPercentage);
        
        console.log(chalk.blue('\n=== Claude Usage Monitor ==='));
        console.log(`Subscription: ${chalk.cyan(tier.name)} ${tier.isAdapted ? chalk.green('[ADAPTED]') : chalk.yellow('[ESTIMATED]')}`);
        
        // Show learning status
        if (tier.isAdapted) {
            const events = this.thresholdData.throttleEvents.length;
            console.log(chalk.green(`Limits based on ${events} throttle event${events !== 1 ? 's' : ''}`));
        } else {
            console.log(chalk.yellow('Using initial estimates - will adapt based on actual throttle events'));
        }
        
        // Message usage
        console.log(`Messages: ${chalk.white(usage)} / ${limit} (${messagePercentage.toFixed(1)}%)`);
        
        // Token usage
        const tokenDisplay = tokenUsage > 1000000 ? 
            `${(tokenUsage / 1000000).toFixed(1)}M` : 
            tokenUsage > 1000 ? `${(tokenUsage / 1000).toFixed(1)}K` : tokenUsage;
        const tokenLimitDisplay = tokenLimit > 1000000 ? 
            `${(tokenLimit / 1000000).toFixed(1)}M` : `${(tokenLimit / 1000).toFixed(1)}K`;
        console.log(`Tokens: ${chalk.white(tokenDisplay)} / ${tokenLimitDisplay} (${tokenPercentage.toFixed(1)}%)`);
        
        // Concurrent sessions
        if (sessionInfo && sessionInfo.activeSessions > 0) {
            let sessionColor = chalk.green;
            if (sessionInfo.activeSessions > tier.concurrentSessions) {
                sessionColor = chalk.red;
            } else if (sessionInfo.activeSessions >= tier.concurrentSessions * 0.8) {
                sessionColor = chalk.yellow;
            }
            console.log(`Active Sessions: ${sessionColor(sessionInfo.activeSessions)} / ${tier.concurrentSessions} concurrent`);
        }
        
        // Visual progress bar for combined usage
        const barLength = 30;
        const filledLength = Math.round((percentage / 100) * barLength);
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
        
        let barColor = chalk.green;
        if (percentage >= tier.criticalThreshold * 100) {
            barColor = chalk.red;
        } else if (percentage >= tier.warningThreshold * 100) {
            barColor = chalk.yellow;
        }
        
        console.log(`Combined Usage: ${barColor(bar)} ${percentage.toFixed(1)}%`);
        
        // Time until reset
        const resetTime = this.getResetTime();
        console.log(`Reset in: ${chalk.cyan(resetTime)}`);
        
        // Warnings
        if (percentage >= tier.criticalThreshold * 100) {
            console.log(chalk.red.bold('\n⚠️  CRITICAL: You are very close to the usage limit!'));
            console.log(chalk.red('You may be downgraded to a lower model soon.'));
        } else if (percentage >= tier.warningThreshold * 100) {
            console.log(chalk.yellow.bold('\n⚠️  WARNING: Approaching usage limit'));
            console.log(chalk.yellow(`Consider spacing out usage over the next ${resetTime}`));
        } else {
            console.log(chalk.green('\n✓ Usage is within safe limits'));
        }
        
        // Concurrent session warning
        if (sessionInfo && sessionInfo.activeSessions > tier.concurrentSessions) {
            console.log(chalk.red.bold(`\n⚠️  TOO MANY CONCURRENT SESSIONS!`));
            console.log(chalk.red(`Running ${sessionInfo.activeSessions} sessions but safe limit is ${tier.concurrentSessions}`));
            console.log(chalk.red('Multiple concurrent sessions significantly increase downgrade risk!'));
        }
        
        // Recommendations
        const remaining = limit - usage;
        if (remaining > 0) {
            const hoursUntilReset = this.getHoursUntilReset();
            const safeRate = remaining / Math.max(hoursUntilReset, 1);
            console.log(`\nRemaining messages: ${chalk.white(remaining)}`);
            console.log(`Safe usage rate: ${chalk.white(safeRate.toFixed(1))} messages/hour`);
        }
    }

    /**
     * Get time until reset in human-readable format
     */
    getResetTime() {
        const hours = this.getHoursUntilReset();
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);
        
        if (wholeHours > 0) {
            return `${wholeHours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    /**
     * Get hours until reset
     */
    getHoursUntilReset() {
        const now = new Date();
        const periodStart = new Date(this.usageData.currentPeriod.startDate);
        const resetTime = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
        return Math.max(0, (resetTime - now) / (1000 * 60 * 60));
    }

    /**
     * Set subscription tier
     */
    setSubscription(tier) {
        if (!SUBSCRIPTION_TIERS[tier]) {
            console.error(chalk.red(`Invalid subscription tier. Choose from: ${Object.keys(SUBSCRIPTION_TIERS).join(', ')}`));
            return;
        }
        
        this.usageData.subscription = tier;
        this.saveUsageData();
        console.log(chalk.green(`✓ Subscription set to: ${SUBSCRIPTION_TIERS[tier].name}`));
        this.displayStatus();
    }

    /**
     * Show usage history
     */
    showHistory(days = 7) {
        console.log(chalk.blue(`\n=== Usage History (Last ${days} days) ===`));
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const relevantHistory = this.usageData.history
            .filter(period => new Date(period.startDate) >= cutoffDate)
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        
        if (relevantHistory.length === 0) {
            console.log('No historical data available');
            return;
        }
        
        relevantHistory.forEach(period => {
            const date = new Date(period.startDate).toLocaleDateString();
            const tier = SUBSCRIPTION_TIERS[this.usageData.subscription];
            const percentage = (period.messageCount / tier.dailyMessages) * 100;
            
            let color = chalk.green;
            if (percentage >= tier.criticalThreshold * 100) color = chalk.red;
            else if (percentage >= tier.warningThreshold * 100) color = chalk.yellow;
            
            console.log(`${date}: ${color(period.messageCount + ' messages')} (${percentage.toFixed(1)}%)`);
        });
    }

    /**
     * Export current usage data for throttle event logging
     */
    exportCurrent() {
        const hoursIntoPeriod = this.getHoursUntilReset();
        return {
            subscription: this.usageData.subscription,
            currentPeriod: this.usageData.currentPeriod,
            hoursIntoPeriod: 24 - hoursIntoPeriod
        };
    }

    /**
     * Analyze throttle events to adapt thresholds
     */
    async analyzeThresholds() {
        const throttleDir = path.join(
            path.dirname(USAGE_FILE),
            'throttle-events'
        );
        
        if (!await fs.pathExists(throttleDir)) {
            return;
        }
        
        // Load all throttle events
        const eventFiles = await fs.readdir(throttleDir);
        const events = [];
        
        for (const file of eventFiles) {
            if (file.startsWith('throttle-') && file.endsWith('.json')) {
                try {
                    const event = await fs.readJson(path.join(throttleDir, file));
                    events.push(event);
                } catch (error) {
                    // Skip invalid files
                }
            }
        }
        
        if (events.length === 0) {
            return;
        }
        
        // Group events by subscription
        const eventsBySubscription = {};
        events.forEach(event => {
            const sub = event.subscription || 'unknown';
            if (!eventsBySubscription[sub]) {
                eventsBySubscription[sub] = [];
            }
            eventsBySubscription[sub].push(event);
        });
        
        // Analyze each subscription's events
        Object.keys(eventsBySubscription).forEach(subscription => {
            const subEvents = eventsBySubscription[subscription];
            
            // Calculate conservative limits (90% of lowest observed throttle point)
            const messageThrottles = subEvents.map(e => e.messageCount).filter(n => n > 0);
            const tokenThrottles = subEvents.map(e => e.tokenCount).filter(n => n > 0);
            const sessionThrottles = subEvents.map(e => e.activeSessions).filter(n => n > 0);
            
            if (messageThrottles.length > 0 || tokenThrottles.length > 0) {
                const adaptedLimits = {};
                
                if (messageThrottles.length > 0) {
                    adaptedLimits.dailyMessages = Math.floor(Math.min(...messageThrottles) * 0.9);
                }
                
                if (tokenThrottles.length > 0) {
                    adaptedLimits.dailyTokens = Math.floor(Math.min(...tokenThrottles) * 0.9);
                }
                
                if (sessionThrottles.length > 0) {
                    adaptedLimits.concurrentSessions = Math.max(1, Math.min(...sessionThrottles) - 1);
                }
                
                // Update threshold data
                if (!this.thresholdData.adaptedLimits[subscription]) {
                    this.thresholdData.adaptedLimits[subscription] = {};
                }
                
                Object.assign(this.thresholdData.adaptedLimits[subscription], adaptedLimits);
                
                // Update confidence based on number of events
                this.thresholdData.confidence.messages = Math.min(100, messageThrottles.length * 20);
                this.thresholdData.confidence.tokens = Math.min(100, tokenThrottles.length * 20);
                this.thresholdData.confidence.sessions = Math.min(100, sessionThrottles.length * 25);
            }
        });
        
        // Update learning mode if we have enough data
        this.thresholdData.throttleEvents = events;
        if (events.length >= 3) {
            this.thresholdData.learningMode = 'adaptive';
        }
        
        this.thresholdData.lastUpdated = new Date().toISOString();
        this.saveThresholdData();
        
        console.log(chalk.green(`\n✓ Analyzed ${events.length} throttle events`));
        if (this.thresholdData.learningMode === 'adaptive') {
            console.log(chalk.green('Thresholds have been adapted based on actual usage patterns'));
        }
    }

    /**
     * Show throttle analysis report
     */
    showThresholdReport() {
        console.log(chalk.blue('\n=== Threshold Learning Report ==='));
        console.log(`Mode: ${this.thresholdData.learningMode === 'adaptive' ? 
            chalk.green('ADAPTIVE') : chalk.yellow('ESTIMATES')}`);
        console.log(`Last Updated: ${new Date(this.thresholdData.lastUpdated).toLocaleString()}`);
        console.log(`Throttle Events: ${this.thresholdData.throttleEvents.length}`);
        
        if (this.thresholdData.learningMode === 'adaptive') {
            console.log(chalk.green('\nAdapted Limits:'));
            Object.keys(this.thresholdData.adaptedLimits).forEach(sub => {
                console.log(`\n${chalk.cyan(sub)}:`);
                const limits = this.thresholdData.adaptedLimits[sub];
                if (limits.dailyMessages) {
                    console.log(`  Messages: ${limits.dailyMessages}/day`);
                }
                if (limits.dailyTokens) {
                    console.log(`  Tokens: ${(limits.dailyTokens / 1000000).toFixed(1)}M/day`);
                }
                if (limits.concurrentSessions) {
                    console.log(`  Concurrent Sessions: ${limits.concurrentSessions}`);
                }
            });
            
            console.log(chalk.green('\nConfidence Levels:'));
            console.log(`  Messages: ${this.thresholdData.confidence.messages}%`);
            console.log(`  Tokens: ${this.thresholdData.confidence.tokens}%`);
            console.log(`  Sessions: ${this.thresholdData.confidence.sessions}%`);
        } else {
            console.log(chalk.yellow('\nNot enough throttle events to adapt thresholds yet.'));
            console.log(chalk.yellow('Continue using the tool - limits will adapt automatically.'));
        }
    }

    /**
     * Clear all usage data
     */
    clearData() {
        this.usageData = {
            subscription: this.usageData.subscription,
            currentPeriod: {
                startDate: new Date().toISOString(),
                messageCount: 0,
                tokenCount: 0,
                sessionCount: 0,
                peakConcurrentSessions: 0,
                lastUpdated: new Date().toISOString()
            },
            history: []
        };
        this.saveUsageData();
        console.log(chalk.green('✓ Usage data cleared'));
    }
}

// Set up command line interface
program
    .version('0.1.0')
    .description('Monitor Claude API usage to avoid downgrades');

program
    .command('status')
    .description('Show current usage status')
    .action(async () => {
        const monitor = new UsageMonitor();
        monitor.checkAndResetPeriod();
        await monitor.displayStatus();
    });

program
    .command('record [count]')
    .description('Record message(s) sent to Claude')
    .action((count) => {
        const monitor = new UsageMonitor();
        monitor.recordMessage(parseInt(count) || 1);
    });

program
    .command('set-subscription <tier>')
    .description('Set subscription tier (free, pro, max)')
    .action((tier) => {
        const monitor = new UsageMonitor();
        monitor.setSubscription(tier.toLowerCase());
    });

program
    .command('history [days]')
    .description('Show usage history')
    .action((days) => {
        const monitor = new UsageMonitor();
        monitor.showHistory(parseInt(days) || 7);
    });

program
    .command('clear')
    .description('Clear all usage data')
    .action(() => {
        const monitor = new UsageMonitor();
        monitor.clearData();
    });

program
    .command('process-sessions')
    .description('Process session files (called automatically by claude wrapper)')
    .action(async () => {
        const monitor = new UsageMonitor();
        await monitor.processSessions();
    });

program
    .command('export-current')
    .description('Export current usage data (used by claude wrapper)')
    .action(() => {
        const monitor = new UsageMonitor();
        console.log(JSON.stringify(monitor.exportCurrent()));
    });

program
    .command('analyze-thresholds')
    .description('Analyze throttle events and adapt limits')
    .action(async () => {
        const monitor = new UsageMonitor();
        await monitor.analyzeThresholds();
    });

program
    .command('threshold-report')
    .description('Show threshold learning report')
    .action(() => {
        const monitor = new UsageMonitor();
        monitor.showThresholdReport();
    });

// Default action
if (!process.argv.slice(2).length) {
    (async () => {
        const monitor = new UsageMonitor();
        monitor.checkAndResetPeriod();
        await monitor.displayStatus();
    })();
}

program.parse(process.argv);