/**
 * Suggestion commands functionality for slash commands
 * Reads commands directly from session metadata storage
 * Supports both legacy string format and new structured format with descriptions
 */

import Fuse from 'fuse.js';
import { storage } from './storage';
import { SlashCommand } from './storageTypes';

export interface CommandItem {
    command: string;        // The command without slash (e.g., "compact" or "frontend:component")
    description?: string;   // Optional description of what the command does
    namespace?: string;     // Optional namespace/category (e.g., "frontend" from "frontend:component")
    source?: 'builtin' | 'project' | 'user'; // Where the command comes from
}

interface SearchOptions {
    limit?: number;
    threshold?: number;
}

// Commands to ignore/filter out (CLI-only commands)
export const IGNORED_COMMANDS = [
    "add-dir",
    "agents",
    "config",
    "statusline",
    "bashes",
    "settings",
    "cost",
    "doctor",
    "exit",
    "help",
    "ide",
    "init",
    "install-github-app",
    "mcp",
    "memory",
    "migrate-installer",
    "model",
    "pr-comments",
    "release-notes",
    "resume",
    "status",
    "bug",
    "review",
    "security-review",
    "terminal-setup",
    "upgrade",
    "vim",
    "permissions",
    "hooks",
    "export",
    "logout",
    "login"
];

// Default commands always available
const DEFAULT_COMMANDS: CommandItem[] = [
    { command: 'compact', description: 'Compact the conversation history', source: 'builtin' },
    { command: 'clear', description: 'Clear the conversation', source: 'builtin' }
];

// Fallback descriptions for known commands (used when server doesn't provide description)
const FALLBACK_DESCRIPTIONS: Record<string, string> = {
    compact: 'Compact the conversation history',
    clear: 'Clear the conversation',
    help: 'Show available commands',
    reset: 'Reset the session',
    debug: 'Show debug information',
    stop: 'Stop current operation',
    abort: 'Abort current operation',
    cancel: 'Cancel current operation',
};

/**
 * Parse namespace from command name
 * e.g., "frontend:component" -> { namespace: "frontend", command: "frontend:component" }
 */
function parseNamespace(commandName: string): { namespace?: string; baseName: string } {
    const colonIndex = commandName.indexOf(':');
    if (colonIndex > 0) {
        return {
            namespace: commandName.substring(0, colonIndex),
            baseName: commandName.substring(colonIndex + 1)
        };
    }
    return { baseName: commandName };
}

/**
 * Normalize slash command to CommandItem
 * Handles both legacy string format and new structured format
 */
function normalizeCommand(cmd: string | SlashCommand): CommandItem {
    if (typeof cmd === 'string') {
        // Legacy string format
        const { namespace } = parseNamespace(cmd);
        return {
            command: cmd,
            description: FALLBACK_DESCRIPTIONS[cmd],
            namespace,
            source: 'project'
        };
    } else {
        // New structured format
        const { namespace } = parseNamespace(cmd.name);
        return {
            command: cmd.name,
            description: cmd.description || FALLBACK_DESCRIPTIONS[cmd.name],
            namespace,
            source: cmd.source || 'project'
        };
    }
}

// Get commands from session metadata
function getCommandsFromSession(sessionId: string): CommandItem[] {
    const state = storage.getState();
    const session = state.sessions[sessionId];
    if (!session || !session.metadata) {
        return DEFAULT_COMMANDS;
    }

    const commands: CommandItem[] = [...DEFAULT_COMMANDS];
    const addedCommands = new Set(commands.map(c => c.command));

    // Add commands from metadata.slashCommands (filter with ignore list)
    if (session.metadata.slashCommands) {
        for (const cmd of session.metadata.slashCommands) {
            const normalized = normalizeCommand(cmd);

            // Skip if in ignore list
            if (IGNORED_COMMANDS.includes(normalized.command)) continue;

            // Skip if already added
            if (addedCommands.has(normalized.command)) continue;

            commands.push(normalized);
            addedCommands.add(normalized.command);
        }
    }

    return commands;
}

// Main export: search commands with fuzzy matching
export async function searchCommands(
    sessionId: string,
    query: string,
    options: SearchOptions = {}
): Promise<CommandItem[]> {
    const { limit = 10, threshold = 0.3 } = options;
    
    // Get commands from session metadata (no caching)
    const commands = getCommandsFromSession(sessionId);
    
    // If query is empty, return all commands
    if (!query || query.trim().length === 0) {
        return commands.slice(0, limit);
    }
    
    // Setup Fuse for fuzzy search
    const fuseOptions = {
        keys: [
            { name: 'command', weight: 0.7 },
            { name: 'description', weight: 0.3 }
        ],
        threshold,
        includeScore: true,
        shouldSort: true,
        minMatchCharLength: 1,
        ignoreLocation: true,
        useExtendedSearch: true
    };
    
    const fuse = new Fuse(commands, fuseOptions);
    const results = fuse.search(query, { limit });
    
    return results.map(result => result.item);
}

// Get all available commands for a session
export function getAllCommands(sessionId: string): CommandItem[] {
    return getCommandsFromSession(sessionId);
}