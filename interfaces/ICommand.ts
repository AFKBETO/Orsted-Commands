import {
    CommandInteraction,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

export interface ICommand {
    cooldown?: number;
    data:
        | SlashCommandBuilder
        | SlashCommandSubcommandsOnlyBuilder
        | SlashCommandOptionsOnlyBuilder;
    execute: (interaction: CommandInteraction) => Promise<void>;
}
