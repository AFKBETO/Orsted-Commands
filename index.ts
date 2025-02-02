import * as path from '@std/path';
import { ICommand } from './interfaces/ICommand.ts';
import { isICommand } from './utils/isICommand.ts';

const commands: ICommand[] = [];
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

        if (isICommand(command)) {
            commands.push(command);
        } else {
            console.info(
                `Skipping ${file.name} as it does not implement ICommand: Missing required "data" or "execute" properties.`,
            );
        }
    }
}

export { commands };
