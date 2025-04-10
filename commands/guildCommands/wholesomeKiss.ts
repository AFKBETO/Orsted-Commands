import { BotCommand } from '@orsted/utils';
import { SlashCommandBuilder } from 'discord.js';
import { setCommandName } from '../../utils/setCommandName.ts';
import { CommandInteraction } from 'discord.js';

const wholesomeUrl = [
    'https://media.discordapp.net/attachments/824175906120663060/843483983080849418/E0ndCMxVoAAeSy3.png?width=804&height=504',
    'https://media.discordapp.net/attachments/824175906120663060/843465128644313108/20210511_104844.png?width=952&height=504',
];

/**
 * Slash command to post a wholesome kiss
 */

const wholesomeKiss: BotCommand = {
    data: new SlashCommandBuilder()
        .setName(setCommandName('wholesomekiss'))
        .setDescription('Post a wholesome kiss'),
    execute: async (interaction: CommandInteraction) => {
        try {
            await interaction.reply(wholesomeUrl.randomItem());
        } catch (error) {
            console.error(new Date(), 'wholesomeKiss');
            console.error(error);
        }
    },
};

export default wholesomeKiss;
