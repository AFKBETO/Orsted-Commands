import { config } from '../config/config.ts';

/**
 * Sets the command name based on the environment.
 * @param {string} command - The original command name.
 * @returns {string} - The modified command name for testing or production.
 */

export function setCommandName(command: string): string {
    if (config.environment === 'production') {
        return command;
    }
    return `${command}-test`;
}
