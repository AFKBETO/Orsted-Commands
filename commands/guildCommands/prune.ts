import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    CommandInteraction,
    CommandInteractionOptionResolver,
    ComponentType,
    EmbedBuilder,
    Message,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
} from 'discord.js';
import { SlashCommand } from '@orsted/utils';
import { setCommandName } from '../../utils/setCommandName.ts';
import { trashId } from '../../config/channels.ts';

const prune: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName(setCommandName('prune'))
        .setDescription('Delete messages in bulk')
        .addIntegerOption((option) =>
            option
                .setName('amount')
                .setDescription('Number of messages to delete')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageMessages,
        ) as SlashCommandBuilder,
    execute: async (interaction: CommandInteraction) => {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const channel = interaction.channel as TextChannel;
            if (!channel) {
                await interaction.editReply(
                    'This command can only be used in text channels.',
                );
                return;
            }
            const options = interaction
                .options as CommandInteractionOptionResolver;
            const amount = options.getInteger('amount', true);
            const messages = await channel.messages.fetch({ limit: amount });
            if (messages.size === 0) {
                await interaction.editReply('No messages to delete.');
                return;
            }
            let authorId = '';
            const embeds: EmbedBuilder[] = [];
            for (const messageEntry of messages.reverse()) {
                const message = messageEntry[1] as Message;
                if (message.flags.has(MessageFlags.Ephemeral)) {
                    continue;
                }
                if (authorId !== message.author.id) {
                    embeds.push(
                        new EmbedBuilder()
                            .setColor('#0099ff')
                            .setAuthor({
                                name: message.author.tag,
                                iconURL: message.author.displayAvatarURL(),
                            })
                            .setTitle(
                                `Deleted message from ${message.author.displayName}`,
                            )
                            .setFooter({
                                text: `#${channel.name}`,
                            })
                            .setDescription(' '),
                    );
                    authorId = message.author.id;
                }
                const messageEmbed = embeds[embeds.length - 1];
                const embedContent = messageEmbed.data.description === ' '
                    ? ''
                    : messageEmbed.data.description;
                const messageContent = embedContent + `${message.content}\n`;

                messageEmbed.setDescription(messageContent);
            }

            const cancelButton = new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary);
            const confirmButton = new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('Confirm Delete')
                .setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                confirmButton,
                cancelButton,
            );
            const confirmMessage = await interaction.editReply({
                content:
                    `Are you sure you want to delete ${messages.size} messages? Oldest message to delete: ${
                        messages.last()!.url
                    }`,
                components: [row],
            });

            try {
                const collectorFilter = (i: ButtonInteraction) =>
                    i.user.id === interaction.user.id;
                const confirmation = await confirmMessage.awaitMessageComponent(
                    {
                        filter: collectorFilter,
                        componentType: ComponentType.Button,
                        time: 45_000,
                    },
                );
                if (confirmation.customId === 'cancel') {
                    await confirmation.update({
                        content: 'Prune cancelled',
                        components: [],
                    });
                    return;
                }
                await confirmation.update({
                    content: 'Deleting messages...',
                    components: [],
                });
                const deletedMessages = await channel.bulkDelete(
                    messages,
                    true,
                );
                await interaction.editReply(
                    `Deleted ${deletedMessages.size} messages.`,
                );
                if (embeds.length > 0) {
                    const trashChannel = interaction.client.channels.cache.get(
                        trashId,
                    ) as TextChannel;
                    await trashChannel.send({
                        content:
                            `Deleted ${messages.size} messages in ${channel}`,
                        embeds: embeds,
                    });
                }
            } catch {
                await interaction.editReply({
                    content: 'Confirmation timed out',
                    components: [],
                });
                return;
            }
        } catch (error) {
            console.error(new Date(), 'prune');
            console.error(error);
        }
    },
};

export default prune;
