import { BotCommand } from '@orsted/utils';
import { SlashCommandBuilder } from 'discord.js';
import { setCommandName } from '../../utils/setCommandName.ts';
import { ChatInputCommandInteraction } from 'discord.js';

/**
 * Slash command to post a wholesome kiss
 */

const wholesomeKiss: BotCommand = {
    data: new SlashCommandBuilder()
        .setName(setCommandName('wholesomekiss'))
        .setDescription('Post a wholesome kiss'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        try {
            const wholesomeUrl = interaction.client.images.get(
                'wholesomeKiss',
            )!;
            await interaction.reply(wholesomeUrl.randomItem());
        } catch (error) {
            console.error(new Date(), 'wholesomeKiss');
            console.error(error);
        }
    },
};

export default wholesomeKiss;
