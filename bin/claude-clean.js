#!/usr/bin/env node

/**
 * claude-clean.js
 * 
 * This script attempts to remove traces of Claude Code from project directories.
 * It searches for and removes Claude-related files and directories.
 */

const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

// Patterns that indicate Claude-related files
const CLAUDE_PATTERNS = [
    '.claude',
    '.claude-code',
    'claude-code',
    '**/.claude',
    '**/.claude-code',
    '**/claude-code',
    '**/*.claude*',
    '**/CLAUDE.md'
];

class ClaudeCleaner {
    constructor(options) {
        this.recursive = options.recursive || false;
        this.dryRun = options.dryRun || false;
        this.verbose = options.verbose || false;
        this.foundItems = [];
    }

    /**
     * This method attempts to find all Claude-related files in the given directory
     */
    async findClaudeFiles(targetDir) {
        console.log(chalk.blue(`Scanning ${targetDir} for Claude artifacts...`));
        
        for (const pattern of CLAUDE_PATTERNS) {
            try {
                const matches = glob.sync(pattern, {
                    cwd: targetDir,
                    dot: true,
                    absolute: true
                });
                
                this.foundItems.push(...matches);
            } catch (error) {
                // We're trying to handle cases where glob might fail
                if (this.verbose) {
                    console.error(chalk.yellow(`Warning: ${error.message}`));
                }
            }
        }
        
        // Remove duplicates
        this.foundItems = [...new Set(this.foundItems)];
        
        return this.foundItems;
    }

    /**
     * This method attempts to remove the found Claude-related files
     */
    async cleanFiles() {
        if (this.foundItems.length === 0) {
            console.log(chalk.green('No Claude artifacts found.'));
            return;
        }

        // Get the tools project directory to protect CLAUDE.md there
        const toolsProjectDir = path.resolve(__dirname, '..');
        
        console.log(chalk.yellow(`Found ${this.foundItems.length} Claude artifact(s):`));
        
        for (const item of this.foundItems) {
            const itemPath = path.resolve(item);
            const isProjectClaudeMd = itemPath === path.join(toolsProjectDir, 'CLAUDE.md');
            
            console.log(`  - ${item}`);
            
            if (isProjectClaudeMd) {
                console.log(chalk.blue(`    ⚠ Skipped (project documentation)`));
                continue;
            }
            
            if (!this.dryRun) {
                try {
                    await fs.remove(item);
                    console.log(chalk.green(`    ✓ Removed`));
                } catch (error) {
                    console.log(chalk.red(`    ✗ Failed: ${error.message}`));
                }
            }
        }
        
        if (this.dryRun) {
            console.log(chalk.yellow('\nDry run mode - no files were actually removed.'));
        }
    }

    /**
     * Main execution method
     */
    async run(targetDir) {
        const resolvedDir = path.resolve(targetDir);
        
        // Check if directory exists
        if (!await fs.pathExists(resolvedDir)) {
            console.error(chalk.red(`Error: Directory ${resolvedDir} does not exist.`));
            process.exit(1);
        }
        
        await this.findClaudeFiles(resolvedDir);
        await this.cleanFiles();
        
        console.log(chalk.green('\nClean operation completed.'));
    }
}

// Set up command line interface
program
    .version('0.1.0')
    .description('Remove Claude Code artifacts from project directories')
    .argument('[directory]', 'Target directory to clean', '.')
    .option('-r, --recursive', 'Clean recursively in subdirectories')
    .option('-d, --dry-run', 'Show what would be removed without actually removing')
    .option('-v, --verbose', 'Show detailed output')
    .action(async (directory, options) => {
        const cleaner = new ClaudeCleaner(options);
        await cleaner.run(directory);
    });

program.parse(process.argv);