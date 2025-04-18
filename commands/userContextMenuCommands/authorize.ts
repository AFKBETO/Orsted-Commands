import { UserContextMenuCommand } from '@orsted/utils';
import {
    ApplicationCommandType,
    ContextMenuCommandBuilder,
    GuildMember,
    MessageFlags,
    PermissionFlagsBits,
    Role,
    TextChannel,
    UserContextMenuCommandInteraction,
} from 'discord.js';
import { setCommandName } from '../../utils/setCommandName.ts';
import { config } from '../../config/config.ts';

/**
 * User context menu command to authorize a user
 * This command will add the authorize role to the user
 * This command is only available to users with the Manage Roles permission
 */

const authorize: UserContextMenuCommand = {
    data: new ContextMenuCommandBuilder()
        .setName(setCommandName('authorize'))
        .setType(ApplicationCommandType.User)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    execute: async (interaction: UserContextMenuCommandInteraction) => {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const target = interaction.targetMember as GuildMember;
            const authorizeRole = interaction.guild?.roles.cache.find((role) =>
                role.name === interaction.client.botConfig.authorizeRole
            ) as Role;

            if (target.roles.cache.has(authorizeRole.id)) {
                await interaction.editReply(
                    `User ${target} is already authorized.`,
                );
                return;
            }
            const { generalId, botDevId } = interaction.client.botConfig;
            const channelId = config.environment === 'production'
                ? generalId
                : botDevId;

            const welcomeChannel = interaction.guild?.channels.cache.get(
                channelId,
            ) as TextChannel;

            await target.roles.add(authorizeRole);
            await welcomeChannel.send(`Welcome ${target}`);
            await interaction.editReply(`User ${target} has been authorized.`);
        } catch (error) {
            console.error(new Date(), 'authorize');
            console.error(error);
        }
    },
};

export default authorize;
