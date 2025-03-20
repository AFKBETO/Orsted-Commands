import {
    CommandInteraction,
    CommandInteractionOptionResolver,
    EmbedBuilder,
    SlashCommandBuilder,
} from 'discord.js';
import { getMatchData, SlashCommand } from '@orsted/utils';
import { setCommandName } from '../../utils/setCommandName.ts';
import { randomName } from '../../utils/randomName.ts';

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
    execute: async (interaction: CommandInteraction) => {
        try {
            await interaction.deferReply();
            const { user } = interaction;
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
                shippedTarget = randomName();
                while (shippedTarget === 'Orsted') {
                    shippedTarget = randomName();
                }
                const matchData = await getMatchData(target1.id, shippedTarget);
                msgEmbed.setDescription(
                    `The compatibility of ${target1} and ${shippedTarget} is ${matchData.value}%. ${
                        getCommentOnMatchValue(matchData.value)
                    }`,
                );
            } else {
                const matchData = await getMatchData(target1.id, target2.id);
                msgEmbed.setDescription(
                    `The compatibility of ${target1} and ${target2} is ${matchData.value}%. ${
                        getCommentOnMatchValue(matchData.value)
                    }`,
                );
            }
            await interaction.editReply({ embeds: [msgEmbed] });
        } catch (error) {
            console.error(new Date(), 'match');
            console.error(error);
        }
    },
};

export default match;
