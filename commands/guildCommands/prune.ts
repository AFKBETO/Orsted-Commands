import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
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

/**
 * Slash command to delete messages in bulk
 * This command is only available to users with the Manage Messages permission.
 * Can delete up to 100 messages at a time.
 */

const prune: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName(setCommandName('prune'))
        .setDescription(
            'Delete messages in bulk. Shallow prune by default (up to 14 days old).',
        )
        .addIntegerOption((option) =>
            option
                .setName('amount')
                .setDescription('Number of messages to delete')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addBooleanOption((option) =>
            option
                .setName('deep')
                .setDescription(
                    'Delete messages older than 14 days (this will take more time)',
                )
                .setRequired(false)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageMessages,
        ) as SlashCommandBuilder,
    execute: async (interaction: ChatInputCommandInteraction) => {
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
            const isDeepPrune = options.getBoolean('deep', false) ?? false;
            const messages = await channel.messages.fetch({
                limit: amount,
                cache: false,
            });
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
                        messages.first()!.url
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
                        time: isDeepPrune ? 120_000 : 45_000,
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

                let deleteCount = 0;
                if (isDeepPrune) {
                    for (const messageEntry of messages) {
                        const message = messageEntry[1] as Message;
                        if (message.flags.has(MessageFlags.Ephemeral)) {
                            continue;
                        }
                        deleteCount++;
                        await message.delete();
                    }
                } else {
                    await channel.bulkDelete(messages, true);
                    deleteCount = messages.size;
                }
                await interaction.editReply(
                    `Deleted ${deleteCount} messages.`,
                );
                if (embeds.length > 0) {
                    const trashChannel = interaction.client.channels.cache.get(
                        interaction.client.botConfig.trashId,
                    ) as TextChannel;
                    await trashChannel.send({
                        content:
                            `Deleted ${messages.size} messages in ${channel}`,
                        embeds: embeds,
                    });
                }
                return;
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
