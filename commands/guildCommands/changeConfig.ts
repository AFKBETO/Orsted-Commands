import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Collection,
    CommandInteraction,
    ComponentType,
    MessageFlags,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import {
    ConfigData,
    ConfigField,
    configurableFields,
    SlashCommand,
    updateConfigData,
} from '@orsted/utils';
import { setCommandName } from '../../utils/setCommandName.ts';

const CONFIG_TIMEOUT = 120_000;
const MODAL_TIMEOUT = 60_000;
//split configurableFields into groups of 5

function getConfigurableFieldsGroups() {
    const result: Collection<string, ConfigField[]> = new Collection();
    for (let i = 0; i < configurableFields.length; i += 5) {
        const group = configurableFields.slice(i, i + 5);
        result.set(group.join(','), group);
    }
    return result;
}

const configurableFieldsGroups = getConfigurableFieldsGroups();

function verifyChanges(oldConfig: ConfigData, newConfig: ConfigData): boolean {
    for (const field of configurableFields) {
        if (
            field === 'maleNames' || field === 'femaleNames' ||
            field === 'twitterEmbedLinks'
        ) {
            if (
                JSON.stringify(oldConfig[field]) !==
                    JSON.stringify(newConfig[field])
            ) {
                return true;
            }
        } else if (oldConfig[field] !== newConfig[field]) {
            return true;
        }
    }
    return false;
}

let newConfig: ConfigData;

async function onButtonInteraction(
    buttonInteraction: ButtonInteraction,
): Promise<boolean> {
    try {
        const { botConfig } = buttonInteraction.client;
        if (buttonInteraction.customId === 'confirm') {
            if (!verifyChanges(botConfig, newConfig)) {
                await buttonInteraction.reply({
                    content: 'No changes were made',
                    flags: MessageFlags.Ephemeral,
                });
                return true;
            }
            const result = await updateConfigData(newConfig);
            if (!result) {
                await buttonInteraction.reply({
                    content: 'Failed to change the config',
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                buttonInteraction.client.botConfig = newConfig;
                await buttonInteraction.reply({
                    content: 'The config has been changed',
                    flags: MessageFlags.Ephemeral,
                });
            }
            return true;
        }
        if (buttonInteraction.customId === 'reset') {
            newConfig = { ...botConfig };
            await buttonInteraction.reply({
                content: 'Config has been reset',
                flags: MessageFlags.Ephemeral,
            });
            return false;
        }
        if (
            configurableFieldsGroups.keys().toArray().includes(
                buttonInteraction.customId,
            )
        ) {
            const modal = new ModalBuilder()
                .setCustomId(buttonInteraction.customId)
                .setTitle('Change config');

            for (
                const field of configurableFieldsGroups.get(
                    buttonInteraction.customId,
                )!
            ) {
                const textInput = new TextInputBuilder()
                    .setCustomId(field)
                    .setLabel(field)
                    .setRequired(true);
                let value = '';
                if (Array.isArray(newConfig[field])) {
                    textInput.setStyle(TextInputStyle.Paragraph);
                    value = newConfig[field].join(', ');
                } else {
                    textInput.setStyle(TextInputStyle.Short);
                    value = newConfig[field];
                }
                textInput.setValue(value);
                const row = new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(textInput);
                modal.addComponents(row);
            }
            await buttonInteraction.showModal(modal);
            try {
                const input = await buttonInteraction.awaitModalSubmit({
                    filter: (i) => i.customId === buttonInteraction.customId,
                    time: MODAL_TIMEOUT,
                });
                if (!input) {
                    return false;
                }
                for (
                    const field of configurableFieldsGroups.get(
                        buttonInteraction.customId,
                    )!
                ) {
                    const value = input.fields.getTextInputValue(field);
                    if (
                        field === 'maleNames' || field === 'femaleNames' ||
                        field === 'twitterEmbedLinks'
                    ) {
                        newConfig[field] = value.split(',').map((name) =>
                            name.trim()
                        );
                    } else {
                        newConfig[field] = value;
                    }
                }
                await input.reply({
                    content: `Updated ${buttonInteraction.customId}`,
                    flags: MessageFlags.Ephemeral,
                });
            } catch (error) {
                console.log('Error in modal submit', error);
            }
        }
        return false;
    } catch (error) {
        console.error(new Date(), 'onButtonInteraction');
        console.error(error);
        buttonInteraction.reply({
            content: 'An error occurred while processing your request',
            flags: MessageFlags.Ephemeral,
        });
        return false;
    }
}
/**
 * Sends a message as the bot in the channel where the command was executed.
 */

const changeConfig: SlashCommand = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName(setCommandName('changeconfig'))
        .setDescription('Change the config for the bot.')
        .setDefaultMemberPermissions(0),
    execute: async (interaction: CommandInteraction) => {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            let row = new ActionRowBuilder<ButtonBuilder>();
            const confirmButton = new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Primary);
            const resetButton = new ButtonBuilder()
                .setCustomId('reset')
                .setLabel('Reset')
                .setStyle(ButtonStyle.Danger);
            row.addComponents(confirmButton).addComponents(resetButton);
            const components: ActionRowBuilder<ButtonBuilder>[] = [row];

            // Add buttons for each group of configurable fields
            for (const group of configurableFieldsGroups.keys()) {
                if (row.components.length >= 5) {
                    row = new ActionRowBuilder<ButtonBuilder>();
                    components.push(row);
                }
                const button = new ButtonBuilder()
                    .setCustomId(group)
                    .setLabel(group)
                    .setStyle(ButtonStyle.Secondary);
                row.addComponents(button);
            }
            const configMessage = await interaction.editReply({
                content: 'Click a button to change the config',
                components: components,
            });

            const collector = configMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: CONFIG_TIMEOUT,
            });
            newConfig = { ...interaction.client.botConfig };
            collector.on(
                'collect',
                async (buttonInteraction: ButtonInteraction) => {
                    const configSubmitted = await onButtonInteraction(
                        buttonInteraction,
                    );
                    if (configSubmitted) {
                        collector.stop();
                        interaction.editReply({
                            content: 'Config has been submitted',
                            components: [],
                        });
                    }
                },
            );
        } catch (error) {
            console.error(new Date(), 'changeconfig');
            console.error(error);
        }
    },
};

export default changeConfig;
