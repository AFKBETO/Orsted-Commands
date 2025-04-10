import * as path from '@std/path';
import { exists } from '@std/fs/exists';
import {
    MessageContextMenuCommand,
    SlashCommand,
    UserContextMenuCommand,
    Utils,
} from '@orsted/utils';
import * as channels from './config/channels.ts';
import { Collection } from 'discord.js';
import { generateAnimeCommands } from './commands/guildCommands/_animeCmds.ts';

const slashCommands = new Collection<string, SlashCommand>();
const messageContextCommands = new Collection<
    string,
    MessageContextMenuCommand
>();
const userContextCommands = new Collection<string, UserContextMenuCommand>();
const foldersPath = path.join(import.meta.dirname || '.', 'commands');
const commandFolders = Deno.readDirSync(foldersPath);

for (const folder of commandFolders) {
    if (!folder.isDirectory) {
        continue;
    }
    if (folder.name.startsWith('_')) {
		console.info(`Skipping ${folder.name} as it starts with an underscore.`);
        continue;
    }
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
		if (file.name.startsWith('_')) {
			console.info(`Skipping ${file.name} as it starts with an underscore.`);
			continue;
		}
        const filePath = path.join(commandsPath, file.name);
        const fileUrl = path.toFileUrl(filePath);
        const command = (await import(fileUrl.toString())).default;

        if (Utils.isSlashCommand(command)) {
            slashCommands.set(command.data.name, command);
        } else if (Utils.isUserContextMenuCommand(command)) {
            userContextCommands.set(command.data.name, command);
        } else if (Utils.isMessageContextMenuCommand(command)) {
            messageContextCommands.set(command.data.name, command);
        } else {
            console.info(
                `Skipping ${file.name} as it does not implement BotCommand: Missing required "data" or "execute" properties.`,
            );
        }
    }
}
const simpleCommandsPath = path.join(foldersPath, 'secretCommands/_simpleCmds.ts');
const isSimpleCommandsExist = await exists(simpleCommandsPath, {isFile: true});
if (isSimpleCommandsExist) {
	console.log('Loading simple commands...');
    const simpleCommands =
        (await import('./commands/secretCommands/_simpleCmds.ts')).default;
    for (const command of simpleCommands) {
        slashCommands.set(command.data.name, command);
		console.log(`${command.data.name} loaded`);
    }
}

export {
    channels,
    generateAnimeCommands,
    messageContextCommands,
    slashCommands,
    userContextCommands,
};
