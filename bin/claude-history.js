#!/usr/bin/env node

/**
 * claude-history.js
 * 
 * This tool retrieves and displays centralized Claude chat histories
 * from the centralized storage location.
 */

const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');

// Default centralized storage locations
const CLAUDE_CLEAN_DIR = path.join(os.homedir(), '.claude-clean');
const CLAUDE_CENTRALIZED_DIR = process.env.CLAUDE_CENTRAL_STORAGE || 
    path.join(os.homedir(), '.claude-centralized');

class ChatHistoryManager {
    constructor() {
        this.storageLocations = [
            CLAUDE_CLEAN_DIR,
            CLAUDE_CENTRALIZED_DIR
        ];
    }

    /**
     * Find all available conversations
     */
    async findConversations() {
        const conversations = [];
        
        for (const location of this.storageLocations) {
            const conversationsDir = path.join(location, 'conversations');
            
            if (await fs.pathExists(conversationsDir)) {
                const dirs = await fs.readdir(conversationsDir);
                
                for (const dir of dirs) {
                    const metadataPath = path.join(conversationsDir, dir, 'metadata.json');
                    
                    if (await fs.pathExists(metadataPath)) {
                        try {
                            const metadata = await fs.readJson(metadataPath);
                            conversations.push({
                                id: dir,
                                location: location,
                                path: path.join(conversationsDir, dir),
                                ...metadata
                            });
                        } catch (error) {
                            // Skip invalid metadata files
                        }
                    }
                }
            }
        }
        
        return conversations;
    }

    /**
     * Display conversations list
     */
    async listConversations(options = {}) {
        const conversations = await this.findConversations();
        
        if (conversations.length === 0) {
            console.log(chalk.yellow('No centralized conversations found.'));
            console.log(chalk.gray(`Searched in:`));
            this.storageLocations.forEach(loc => {
                console.log(chalk.gray(`  - ${loc}`));
            });
            return;
        }
        
        // Sort by creation date (newest first)
        conversations.sort((a, b) => {
            const dateA = new Date(a.created || 0);
            const dateB = new Date(b.created || 0);
            return dateB - dateA;
        });
        
        // Filter by project path if specified
        let filtered = conversations;
        if (options.project) {
            const projectPath = path.resolve(options.project);
            filtered = conversations.filter(conv => 
                conv.original_path && conv.original_path.includes(projectPath)
            );
        }
        
        // Filter by date range
        if (options.since) {
            const sinceDate = new Date(options.since);
            filtered = filtered.filter(conv => 
                new Date(conv.created || 0) >= sinceDate
            );
        }
        
        if (options.until) {
            const untilDate = new Date(options.until);
            filtered = filtered.filter(conv => 
                new Date(conv.created || 0) <= untilDate
            );
        }
        
        // Display results
        console.log(chalk.blue(`\n=== Claude Chat History ===`));
        console.log(chalk.gray(`Found ${filtered.length} conversation(s)\n`));
        
        filtered.forEach((conv, index) => {
            const date = new Date(conv.created || 0).toLocaleString();
            const projectName = path.basename(conv.original_path || 'Unknown');
            
            console.log(chalk.cyan(`[${index + 1}] ${projectName}`));
            console.log(`    ID: ${conv.id}`);
            console.log(`    Created: ${date}`);
            console.log(`    Path: ${conv.original_path || 'Unknown'}`);
            console.log(`    Storage: ${conv.location}`);
            console.log();
        });
    }

    /**
     * Show detailed information about a specific conversation
     */
    async showConversation(conversationId) {
        const conversations = await this.findConversations();
        const conv = conversations.find(c => c.id === conversationId);
        
        if (!conv) {
            console.error(chalk.red(`Conversation ${conversationId} not found.`));
            return;
        }
        
        console.log(chalk.blue(`\n=== Conversation Details ===`));
        console.log(`ID: ${conv.id}`);
        console.log(`Created: ${new Date(conv.created || 0).toLocaleString()}`);
        console.log(`Project: ${conv.original_path}`);
        console.log(`Storage: ${conv.path}`);
        
        // List files in the conversation
        const files = await fs.readdir(conv.path);
        console.log(chalk.cyan('\nFiles:'));
        
        for (const file of files) {
            const filePath = path.join(conv.path, file);
            const stats = await fs.stat(filePath);
            const size = (stats.size / 1024).toFixed(1) + ' KB';
            console.log(`  - ${file} (${size})`);
        }
        
        // Check for chat messages
        const messagesPath = path.join(conv.path, 'messages.json');
        if (await fs.pathExists(messagesPath)) {
            try {
                const messages = await fs.readJson(messagesPath);
                console.log(chalk.cyan(`\nMessages: ${messages.length || 0}`));
            } catch (error) {
                // Invalid messages file
            }
        }
    }

    /**
     * Search conversations by content
     */
    async searchConversations(query) {
        const conversations = await this.findConversations();
        const results = [];
        
        console.log(chalk.blue(`Searching for "${query}"...`));
        
        for (const conv of conversations) {
            const messagesPath = path.join(conv.path, 'messages.json');
            
            if (await fs.pathExists(messagesPath)) {
                try {
                    const content = await fs.readFile(messagesPath, 'utf8');
                    if (content.toLowerCase().includes(query.toLowerCase())) {
                        results.push(conv);
                    }
                } catch (error) {
                    // Skip unreadable files
                }
            }
        }
        
        if (results.length === 0) {
            console.log(chalk.yellow('No conversations found matching your search.'));
            return;
        }
        
        console.log(chalk.green(`Found ${results.length} conversation(s) containing "${query}"\n`));
        
        results.forEach((conv, index) => {
            const date = new Date(conv.created || 0).toLocaleString();
            const projectName = path.basename(conv.original_path || 'Unknown');
            
            console.log(chalk.cyan(`[${index + 1}] ${projectName}`));
            console.log(`    ID: ${conv.id}`);
            console.log(`    Created: ${date}`);
            console.log();
        });
    }

    /**
     * Show storage statistics
     */
    async showStats() {
        const conversations = await this.findConversations();
        let totalSize = 0;
        const projectCounts = {};
        
        for (const conv of conversations) {
            // Count by project
            const project = conv.original_path || 'Unknown';
            projectCounts[project] = (projectCounts[project] || 0) + 1;
            
            // Calculate size
            const files = await fs.readdir(conv.path);
            for (const file of files) {
                const filePath = path.join(conv.path, file);
                const stats = await fs.stat(filePath);
                totalSize += stats.size;
            }
        }
        
        console.log(chalk.blue('\n=== Storage Statistics ==='));
        console.log(`Total Conversations: ${conversations.length}`);
        console.log(`Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
        
        console.log(chalk.cyan('\nConversations by Project:'));
        Object.entries(projectCounts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([project, count]) => {
                const projectName = path.basename(project);
                console.log(`  ${projectName}: ${count}`);
            });
    }
}

// Set up command line interface
program
    .version('0.1.0')
    .description('View and search centralized Claude chat histories');

program
    .command('list')
    .description('List all conversations')
    .option('-p, --project <path>', 'Filter by project path')
    .option('-s, --since <date>', 'Show conversations since date')
    .option('-u, --until <date>', 'Show conversations until date')
    .action(async (options) => {
        const manager = new ChatHistoryManager();
        await manager.listConversations(options);
    });

program
    .command('show <id>')
    .description('Show details for a specific conversation')
    .action(async (id) => {
        const manager = new ChatHistoryManager();
        await manager.showConversation(id);
    });

program
    .command('search <query>')
    .description('Search conversations by content')
    .action(async (query) => {
        const manager = new ChatHistoryManager();
        await manager.searchConversations(query);
    });

program
    .command('stats')
    .description('Show storage statistics')
    .action(async () => {
        const manager = new ChatHistoryManager();
        await manager.showStats();
    });

// Default action - list conversations
if (!process.argv.slice(2).length) {
    const manager = new ChatHistoryManager();
    manager.listConversations();
}

program.parse(process.argv);