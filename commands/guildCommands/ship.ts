import {
    CommandInteraction,
    CommandInteractionOptionResolver,
    SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '@orsted/utils';
import { setCommandName } from '../../utils/setCommandName.ts';
/**
 * Slash command to ship two users together
 * If one of the users is invalid (same user, bot, etc.) or not provided, a random name will be used
 */
const ship: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName(setCommandName('ship'))
        .setDescription('Ship somebody with someone else')
        .addUserOption((option) =>
            option
                .setName('target1')
                .setDescription('Select a user to ship')
                .setRequired(true)
        )
        .addUserOption((option) =>
            option
                .setName('target2')
                .setDescription('Select a second user to ship')
        ) as SlashCommandBuilder,
    execute: async (interaction: CommandInteraction) => {
        try {
            await interaction.deferReply();
            const options = interaction
                .options as CommandInteractionOptionResolver;

            const { randomName } = interaction.client;

            let target1 = options.getUser('target1', true);
            const target2 = options.getUser('target2');
            let shippedTarget = '';
            if (
                target1.id === interaction.client.user.id ||
                (target2 && target2.id === interaction.client.user.id)
            ) {
                shippedTarget = randomName.get('male');
                target1 = interaction.user;
                await interaction.editReply(
                    `${interaction.client.user} has shipped ${target1} with ${shippedTarget} for trying to ship with ${interaction.client.user.displayName}!`,
                );
                return;
            }
            if (!target2 || target2.id === target1.id) {
                shippedTarget = randomName.get();
                await interaction.editReply(
                    `${interaction.user} has shipped ${target1} with ${shippedTarget}!`,
                );
                return;
            }
            await interaction.editReply(
                `${interaction.user} has shipped ${target1} with ${target2}!`,
            );
            return;
        } catch (error) {
            console.error(new Date(), 'ship');
            console.error(error);
        }
    },
};

export default ship;
