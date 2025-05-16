import {
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
    EmbedBuilder,
    GuildMember,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '@orsted/utils';
import { setCommandName } from '../../utils/setCommandName.ts';

/**
 * Memory for the last spank gif used
 * This is used to prevent the same gif from being used multiple times in a row
 * This is not persistent and will be reset when the bot restarts
 */
const memorySpank = {
    oldSpank: '',
    spankCount: 0,
};

/**
 * Slash command to spank a user
 * This will send a message to the channel with a random spank gif
 */

const spank: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName(setCommandName('spank'))
        .setDescription('Try to spank somebody')
        .addUserOption((option) =>
            option
                .setName('target')
                .setDescription('Select a target')
                .setRequired(true)
        ) as SlashCommandBuilder,
    execute: async (interaction: ChatInputCommandInteraction) => {
        try {
            await interaction.deferReply();
            const { user } = interaction;
            const options = interaction
                .options as CommandInteractionOptionResolver;
            const target = options.getMember('target') as GuildMember;
            const randSpank = interaction.client.images.get('spank')!;

            let spankUrl = memorySpank.oldSpank;
            while (spankUrl === memorySpank.oldSpank) {
                spankUrl = randSpank.randomItem();
                if (spankUrl === memorySpank.oldSpank) {
                    if (memorySpank.spankCount < 2) {
                        memorySpank.spankCount++;
                        break;
                    }
                } else {
                    memorySpank.spankCount = 0;
                }
            }

            memorySpank.oldSpank = spankUrl;

            const msgEmbed = new EmbedBuilder().setTitle('spank').setAuthor({
                name: user.tag,
                iconURL: user.displayAvatarURL(),
            });
            const getSpankDescription = (): string => {
                const isTargetingSelf = target.id === user.id;
                if (isTargetingSelf) {
                    return `${target} has spanked him/herself!`;
                }
                const isTargetBot = target.id === interaction.client.user.id;
                const isTargetAdmin = target.permissions.has(
                    PermissionFlagsBits.Administrator,
                );
                if (isTargetBot || isTargetAdmin) {
                    return `${interaction.client.user} has spanked ${user} for trying to spank ${target}!`;
                }
                const isUserMod = interaction.memberPermissions?.has(
                    PermissionFlagsBits.KickMembers,
                    true,
                );
                const isUserPremium = (interaction.member as GuildMember).roles
                    .premiumSubscriberRole !== null;
                if (isUserMod || isUserPremium) {
                    return `${user} has spanked ${target}!`;
                }
                const isTargetMod = target.permissions.has(
                    PermissionFlagsBits.KickMembers,
                    true,
                );
                const isTargetPremium =
                    target.roles.premiumSubscriberRole !== null;
                if (isTargetMod || isTargetPremium) {
                    return `${user} tried to spank ${target}, but got spanked instead!`;
                }
                return `${user} has been spanked!`;
            };
            msgEmbed.setDescription(getSpankDescription());
            await interaction.editReply({ embeds: [msgEmbed] });
        } catch (error) {
            console.error(new Date(), 'spank');
            console.error(error);
        }
    },
};

export default spank;
