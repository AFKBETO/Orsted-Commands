import { config } from '../config/config.ts';

export function setCommandName(command: string): string {
    if (config.environment === 'production') {
        return command;
    }
    return `${command}-test`;
}
