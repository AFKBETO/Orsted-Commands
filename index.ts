import * as path from '@std/path';
import { BotCommand, Utils } from '@orsted/utils';
import * as channels from './config/channels.ts';
import { Collection } from 'discord.js';

const commands = new Collection<string, BotCommand>();
const foldersPath = path.join(import.meta.dirname || '.', 'commands');
const commandFolders = Deno.readDirSync(foldersPath);

for (const folder of commandFolders) {
    if (!folder.isDirectory) continue;
    const commandsPath = path.join(foldersPath, folder.name);
    const commandFiles = Deno.readDirSync(commandsPath);
    for (const file of commandFiles) {
        if (!file.isFile) {
            console.info(`Skipping ${file.name} as it is not a file.`);
            continue;
        }
        if (!file.name.endsWith('.ts')) {
            console.info(
                `Skipping ${file.name} as it is not a TypeScript file.`,
            );
            continue;
        }
        const filePath = path.join(commandsPath, file.name);
        const fileUrl = path.toFileUrl(filePath);
        const command = (await import(fileUrl.toString())).default;

        if (Utils.isBotCommand(command)) {
            commands.set(command.data.name, command);
        } else {
            console.info(
                `Skipping ${file.name} as it does not implement ICommand: Missing required "data" or "execute" properties.`,
            );
        }
    }
}

export { channels, commands };
