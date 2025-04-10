import {
    ApplicationCommandType,
    AttachmentBuilder,
    ContextMenuCommandBuilder,
    EmbedBuilder,
    MessageContextMenuCommandInteraction,
    PermissionFlagsBits,
    spoiler as spoilerify,
} from 'discord.js';
import { MessageContextMenuCommand, Utils } from '@orsted/utils';
import { setCommandName } from '../../utils/setCommandName.ts';
import { fetchFile } from '../../utils/fetchFile.ts';

/**
 * Context menu command to spoiler a message
 * This command will send a message to the channel with the content of the original message
 * and delete the original message
 * This command is only available to users with the Manage Messages permission
 */

const spoiler: MessageContextMenuCommand = {
    data: new ContextMenuCommandBuilder().setName(setCommandName('spoiler'))
        .setType(ApplicationCommandType.Message).setDefaultMemberPermissions(
            PermissionFlagsBits.ManageMessages,
        ),
    execute: async (interaction: MessageContextMenuCommandInteraction) => {
        try {
            await interaction.deferReply();
            const targetMessage = interaction.targetMessage;
            const isURL = Utils.isValidURL(targetMessage.content);
            const spoilerContent = targetMessage.content.length > 0
                ? spoilerify(targetMessage.content)
                : '';
            const author = targetMessage.author;
            const files: AttachmentBuilder[] = [];
            for (const attachment of targetMessage.attachments) {
                const file = await fetchFile(attachment[1].url);
                files.push(
                    new AttachmentBuilder(file).setName(attachment[1].name)
                        .setSpoiler(true),
                );
            }
            const embeds: EmbedBuilder[] = [];
            if (targetMessage.content.length > 0 && !isURL) {
                embeds.push(
                    new EmbedBuilder()
                        .setAuthor({
                            name: author.tag,
                            iconURL: author.displayAvatarURL(),
                        })
                        .setDescription(spoilerContent)
                        .setTimestamp(targetMessage.createdTimestamp),
                );
            }
            const content = isURL ? spoilerContent : undefined;
            if (!content && embeds.length === 0 && files.length === 0) {
                await interaction.editReply(
                    'The targeted message is empty or contains only embeds',
                );
                setTimeout(async () => {
                    await interaction.deleteReply();
                }, 7000);
                return;
            }
            await interaction.editReply({
                content: content,
                embeds: embeds,
                files: files,
            });
            await targetMessage.delete();
        } catch (error) {
            console.error(new Date(), 'spoiler');
            console.error(error);
        }
    },
};

export default spoiler;
