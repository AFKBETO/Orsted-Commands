import {
    AttachmentBuilder,
    CommandInteraction,
    CommandInteractionOptionResolver,
    EmbedBuilder,
    GuildMember,
    MessageFlags,
    SlashCommandBuilder,
    TextChannel,
} from 'discord.js';
import { createHosData, SlashCommand } from '@orsted/utils';
import { setCommandName } from '../../utils/setCommandName.ts';
import { fetchFile } from '../../utils/fetchFile.ts';

/**
 * Slash command to shame a user
 * This will send a message to the Hall of Shame channel, with a screenshot and a comment
 */

const shame: SlashCommand = {
    data: new SlashCommandBuilder().setName(setCommandName('shame'))
        .setDescription('Shames somebody')
        .addAttachmentOption((option) =>
            option.setName('proof').setDescription('Attach a pic to shame')
                .setRequired(true)
        )
        .addUserOption((option) =>
            option.setName('target').setDescription('Select the user to shame')
        )
        .addStringOption((option) =>
            option.setName('comment').setDescription('Comment on the shame')
        ) as SlashCommandBuilder,
    execute: async (interaction: CommandInteraction) => {
        try {
            const { databaseId, shameId, shameReactIconId } =
                interaction.client.botConfig;
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const { user } = interaction;
            const options = interaction
                .options as CommandInteractionOptionResolver;

            const attachmentUrl = options.getAttachment('proof', true).url;
            const target = options.getMember('target') as GuildMember;
            const comment = options.getString('comment') ||
                `Shame on you${target ? `, ${target}` : ''}`;

            const shameChannel = interaction.guild?.channels.cache.get(
                shameId,
            ) as TextChannel;
            const dbChannel = interaction.guild?.channels.cache.get(
                databaseId,
            ) as TextChannel;

            const fileBuffer = await fetchFile(attachmentUrl);
            const attachment = new AttachmentBuilder(fileBuffer).setName(
                'shame.png',
            );

            const imageUrl = (await dbChannel.send({
                files: [attachment],
            })).attachments.first()?.url as string;

            const msgEmbed = new EmbedBuilder().setTitle('Shame')
                .setAuthor({
                    name: user.tag,
                    iconURL: user.displayAvatarURL(),
                })
                .setImage(imageUrl)
                .setDescription(comment);

            const reply = await shameChannel.send({ embeds: [msgEmbed] });
            await reply.react(shameReactIconId);
            await createHosData({
                id: reply.id,
                fromId: user.id,
                targetId: target ? target.id : '',
            });

            await interaction.editReply({
                content: `${target} has been shamed.`,
            });
        } catch (error) {
            console.error(new Date(), 'shame');
            console.error(error);
        }
    },
};

export default shame;
