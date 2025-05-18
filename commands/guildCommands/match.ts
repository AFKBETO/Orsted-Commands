import {
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
    EmbedBuilder,
    SlashCommandBuilder,
} from 'discord.js';
import { getMatchData, SlashCommand } from '@orsted/utils';
import { setCommandName } from '../../utils/setCommandName.ts';
import { User } from 'discord.js';

const EXP_TIME = 86400;

function getCommentOnMatchValue(value: number): string {
    if (value === 69) return 'Nice!';
    if (value === 0) return 'Do you hate each other that much?';
    if (value < 15) return 'What a failure!';
    if (value < 30) return 'Terrible!';
    if (value < 45) return 'Not really good!';
    if (value < 60) return 'Not bad!';
    if (value < 75) return 'Great!';
    if (value < 90) return 'Excellent!';
    return 'Congratulation!';
}

/**
 * Get match data between two names
 * If the data is expired, assign a random value to it
 * @param name1 First name
 * @param name2 Second name
 * @returns Match data
 */

async function getMatchDataBetweenTwoNames(
    name1: User,
    name2: User | string,
): Promise<string> {
    const name2Id = typeof name2 === 'string' ? name2 : name2.id;
    const matchData = await getMatchData(name1.id, name2Id);
    if ((Date.now() - matchData.timestamp) / 1000 > EXP_TIME) {
        matchData.value = Math.floor(Math.random() * 101);
        matchData.timestamp = Date.now();
        await matchData.save();
    }
    return `The compatibility of ${name1} and ${name2} is ${matchData.value}%. ${
        getCommentOnMatchValue(matchData.value)
    }`;
}

/**
 * Slash command to check compatibility between two users
 * If the second user is not provided, a random name will be used
 * Assign a random value to the compatibility, and will reuse this value if this command is used again within a day
 */

const match: SlashCommand = {
    data: new SlashCommandBuilder().setName(setCommandName('match'))
        .setDescription(
            'Check compatibility between somebody with someone else',
        )
        .addUserOption((option) =>
            option
                .setName('target1')
                .setDescription('Select a user to calculate match')
                .setRequired(true)
        )
        .addUserOption((option) =>
            option
                .setName('target2')
                .setDescription('Select a second user to calculate match')
        ) as SlashCommandBuilder,
    execute: async (interaction: ChatInputCommandInteraction) => {
        try {
            await interaction.deferReply();
            const { user } = interaction;
            const { randomName } = interaction.client;
            const options = interaction
                .options as CommandInteractionOptionResolver;
            const target1 = options.getUser('target1', true);
            const target2 = options.getUser('target2');
            let shippedTarget: string;
            const msgEmbed = new EmbedBuilder().setTitle('Match Result')
                .setAuthor({
                    name: user.tag,
                    iconURL: user.displayAvatarURL(),
                });
            if (target2 === null || target1.id === target2.id) {
                shippedTarget = randomName.get();
                while (shippedTarget === 'Orsted') {
                    shippedTarget = randomName.get();
                }
                const message = await getMatchDataBetweenTwoNames(
                    target1,
                    shippedTarget,
                );
                msgEmbed.setDescription(message);
            } else {
                const message = await getMatchDataBetweenTwoNames(
                    target1,
                    target2,
                );
                msgEmbed.setDescription(message);
            }
            await interaction.editReply({ embeds: [msgEmbed] });
        } catch (error) {
            console.error(new Date(), 'match');
            console.error(error);
        }
    },
};

export default match;
