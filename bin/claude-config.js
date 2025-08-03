#!/usr/bin/env node

/**
 * claude-config.js
 * 
 * This tool manages configuration settings for Claude tools,
 * including centralized storage paths and other options.
 */

const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');

// Default configuration file location
const CONFIG_FILE = path.join(
    process.env.CLAUDE_CENTRAL_STORAGE || path.join(os.homedir(), '.claude-centralized'),
    'config.json'
);

// Default configuration
const DEFAULT_CONFIG = {
    storage: {
        centralPath: path.join(os.homedir(), '.claude-centralized'),
        claudeCleanPath: path.join(os.homedir(), '.claude-clean'),
        autoMove: false,
        keepOriginals: false
    },
    cleaning: {
        patterns: [
            '.claude',
            '.claude-code',
            'claude-code',
            '**/.claude',
            '**/.claude-code',
            '**/claude-code',
            '**/*.claude*',
            '**/CLAUDE.md'
        ],
        excludePatterns: []
    },
    monitoring: {
        autoTrack: true,
        warnOnHighUsage: true,
        subscription: 'max'
    },
    history: {
        retentionDays: 90,
        compressOld: false
    }
};

class ConfigManager {
    constructor() {
        this.config = this.loadConfig();
    }

    /**
     * Load configuration from file or create default
     */
    loadConfig() {
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                const loaded = fs.readJsonSync(CONFIG_FILE);
                // Merge with defaults to ensure all keys exist
                return this.mergeDeep(DEFAULT_CONFIG, loaded);
            }
        } catch (error) {
            console.error(chalk.yellow('Warning: Could not load config:', error.message));
        }
        
        return { ...DEFAULT_CONFIG };
    }

    /**
     * Deep merge objects
     */
    mergeDeep(target, source) {
        const output = Object.assign({}, target);
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target))
                        Object.assign(output, { [key]: source[key] });
                    else
                        output[key] = this.mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    /**
     * Check if value is an object
     */
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    /**
     * Save configuration to file
     */
    saveConfig() {
        try {
            fs.ensureDirSync(path.dirname(CONFIG_FILE));
            fs.writeJsonSync(CONFIG_FILE, this.config, { spaces: 2 });
            console.log(chalk.green('✓ Configuration saved'));
        } catch (error) {
            console.error(chalk.red('Error saving config:', error.message));
        }
    }

    /**
     * Get a configuration value
     */
    get(keyPath) {
        const keys = keyPath.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    /**
     * Set a configuration value
     */
    set(keyPath, value) {
        const keys = keyPath.split('.');
        let obj = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in obj) || typeof obj[key] !== 'object') {
                obj[key] = {};
            }
            obj = obj[key];
        }
        
        const lastKey = keys[keys.length - 1];
        
        // Parse value if it looks like JSON
        if (typeof value === 'string') {
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(value)) value = Number(value);
            else if (value.startsWith('[') || value.startsWith('{')) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    // Keep as string if not valid JSON
                }
            }
        }
        
        obj[lastKey] = value;
        this.saveConfig();
        
        console.log(chalk.green(`✓ Set ${keyPath} = ${JSON.stringify(value)}`));
    }

    /**
     * List all configuration values
     */
    list(section) {
        console.log(chalk.blue('\n=== Claude Tools Configuration ==='));
        console.log(chalk.gray(`Config file: ${CONFIG_FILE}\n`));
        
        if (section) {
            const sectionConfig = this.get(section);
            if (sectionConfig && typeof sectionConfig === 'object') {
                this.displayObject(sectionConfig, section);
            } else {
                console.log(chalk.yellow(`Section '${section}' not found or is not an object`));
            }
        } else {
            this.displayObject(this.config);
        }
    }

    /**
     * Display configuration object
     */
    displayObject(obj, prefix = '') {
        Object.entries(obj).forEach(([key, value]) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof value === 'object' && !Array.isArray(value)) {
                console.log(chalk.cyan(`\n${fullKey}:`));
                this.displayObject(value, fullKey);
            } else {
                const displayValue = Array.isArray(value) ? 
                    `[${value.length} items]` : 
                    JSON.stringify(value);
                console.log(`  ${chalk.gray(fullKey)}: ${displayValue}`);
            }
        });
    }

    /**
     * Reset configuration to defaults
     */
    reset() {
        this.config = { ...DEFAULT_CONFIG };
        this.saveConfig();
        console.log(chalk.green('✓ Configuration reset to defaults'));
    }

    /**
     * Set storage path
     */
    setStoragePath(newPath) {
        const resolvedPath = path.resolve(newPath);
        
        // Check if path exists or can be created
        try {
            fs.ensureDirSync(resolvedPath);
        } catch (error) {
            console.error(chalk.red(`Error: Cannot create directory ${resolvedPath}`));
            return;
        }
        
        this.config.storage.centralPath = resolvedPath;
        this.saveConfig();
        
        console.log(chalk.green(`✓ Storage path set to: ${resolvedPath}`));
        
        // Update environment variable for current session
        process.env.CLAUDE_CENTRAL_STORAGE = resolvedPath;
    }

    /**
     * Add a cleaning pattern
     */
    addPattern(pattern) {
        if (!this.config.cleaning.patterns.includes(pattern)) {
            this.config.cleaning.patterns.push(pattern);
            this.saveConfig();
            console.log(chalk.green(`✓ Added cleaning pattern: ${pattern}`));
        } else {
            console.log(chalk.yellow(`Pattern already exists: ${pattern}`));
        }
    }

    /**
     * Remove a cleaning pattern
     */
    removePattern(pattern) {
        const index = this.config.cleaning.patterns.indexOf(pattern);
        if (index > -1) {
            this.config.cleaning.patterns.splice(index, 1);
            this.saveConfig();
            console.log(chalk.green(`✓ Removed cleaning pattern: ${pattern}`));
        } else {
            console.log(chalk.yellow(`Pattern not found: ${pattern}`));
        }
    }

    /**
     * Show current storage paths
     */
    showPaths() {
        console.log(chalk.blue('\n=== Storage Paths ==='));
        console.log(`Central Storage: ${chalk.cyan(this.config.storage.centralPath)}`);
        console.log(`Claude Clean: ${chalk.cyan(this.config.storage.claudeCleanPath)}`);
        console.log(`Config File: ${chalk.cyan(CONFIG_FILE)}`);
        
        // Check if directories exist
        console.log(chalk.blue('\nDirectory Status:'));
        
        const paths = [
            this.config.storage.centralPath,
            this.config.storage.claudeCleanPath,
            path.dirname(CONFIG_FILE)
        ];
        
        paths.forEach(p => {
            const exists = fs.existsSync(p);
            const status = exists ? chalk.green('✓ Exists') : chalk.yellow('✗ Not found');
            console.log(`  ${p}: ${status}`);
        });
    }
}

// Set up command line interface
program
    .version('0.1.0')
    .description('Manage Claude tools configuration');

program
    .command('get <key>')
    .description('Get a configuration value')
    .action((key) => {
        const manager = new ConfigManager();
        const value = manager.get(key);
        if (value !== undefined) {
            console.log(JSON.stringify(value, null, 2));
        } else {
            console.log(chalk.yellow(`Key '${key}' not found`));
        }
    });

program
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action((key, value) => {
        const manager = new ConfigManager();
        manager.set(key, value);
    });

program
    .command('list [section]')
    .description('List all configuration values')
    .action((section) => {
        const manager = new ConfigManager();
        manager.list(section);
    });

program
    .command('reset')
    .description('Reset configuration to defaults')
    .action(() => {
        const manager = new ConfigManager();
        manager.reset();
    });

program
    .command('storage-path <path>')
    .description('Set centralized storage path')
    .action((path) => {
        const manager = new ConfigManager();
        manager.setStoragePath(path);
    });

program
    .command('add-pattern <pattern>')
    .description('Add a cleaning pattern')
    .action((pattern) => {
        const manager = new ConfigManager();
        manager.addPattern(pattern);
    });

program
    .command('remove-pattern <pattern>')
    .description('Remove a cleaning pattern')
    .action((pattern) => {
        const manager = new ConfigManager();
        manager.removePattern(pattern);
    });

program
    .command('paths')
    .description('Show all storage paths')
    .action(() => {
        const manager = new ConfigManager();
        manager.showPaths();
    });

// Default action - list configuration
if (!process.argv.slice(2).length) {
    const manager = new ConfigManager();
    manager.list();
}

program.parse(process.argv);