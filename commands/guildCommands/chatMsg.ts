import {
    CommandInteractionOptionResolver,
    MessageFlags,
    SlashCommandBuilder,
    TextChannel,
} from 'discord.js';
import { SlashCommand } from '@orsted/utils';
import { setCommandName } from '../../utils/setCommandName.ts';
import { CommandInteraction } from 'discord.js';
import { setTimeout } from 'node:timers/promises';

/**
 * Sends a message as the bot in the channel where the command was executed.
 */

const chatMsg: SlashCommand = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName(setCommandName('chat'))
        .setDescription('Send a message as the bot.')
        .addStringOption((option) =>
            option
                .setName('message')
                .setDescription('The message to send.')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('quoteid')
                .setDescription('The ID of the message to quote.')
        )
        .setDefaultMemberPermissions(0) as SlashCommandBuilder,
    execute: async (interaction: CommandInteraction) => {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const channel = await interaction.channel?.fetch() as TextChannel;
            await channel.sendTyping();
            const message =
                (interaction.options as CommandInteractionOptionResolver)
                    .getString('message', true);
            const quoteId =
                (interaction.options as CommandInteractionOptionResolver)
                    .getString('quoteid', false);
            const timeout = Math.min(
                message.length * 150 + Math.random() * 1000,
                10_000,
            );
            await setTimeout(timeout);
            if (quoteId) {
                const quoteMessage = await interaction.channel?.messages.fetch(
                    quoteId,
                );
                if (quoteMessage) {
                    quoteMessage.reply(message);
                } else {
                    throw new Error('Message not found.');
                }
            } else {
                await channel.send(message);
            }
            await interaction.editReply({
                content: 'The message has been sent.',
            });
        } catch (error) {
            console.error(new Date(), 'chat');
            console.error(error);
        }
    },
};

export default chatMsg;
