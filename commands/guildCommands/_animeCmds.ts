import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { AnimeInt, SlashCommand } from '@orsted/utils';
import { setCommandName } from '../../utils/setCommandName.ts';

const WEEK_TIME = 60 * 60 * 24 * 7;
const HOUR_TIME_IN_MS = 1000 * 60 * 60;

/**
 * Generates a list of slash commands for the given anime list stored in the MongoDB database
 * This command will fetch the next episode of the anime from livechart.me, if it is still airing
 */

export function generateAnimeCommands(animeList: AnimeInt[]): SlashCommand[] {
    const result: SlashCommand[] = [];

    for (const anime of animeList) {
        const command: SlashCommand = {
            data: new SlashCommandBuilder()
                .setName(setCommandName(anime.commandName))
                .setDescription(`Get the next episode of ${anime.name}`),
            execute: async (interaction: CommandInteraction) => {
                try {
                    await interaction.deferReply();

                    const liveChart = await fetch(
                        `https://www.livechart.me/anime/${anime.animeId}`,
                    );
                    const liveChartText = await liveChart.text();
                    const regexTimestamp =
                        /data-countdown-bar-timestamp="(.*?)"/g;
                    const matchTimestamp = regexTimestamp.exec(liveChartText);
                    const regexEpisode = /EP(\d+)/g;
                    const matchEpisode = regexEpisode.exec(liveChartText);

                    if (!matchTimestamp || !matchEpisode) {
                        await interaction.editReply(
                            `Cannot find next episode of ${anime.name}`,
                        );
                        return;
                    }

                    let timestamp = parseInt(matchTimestamp[1]);
                    let episode = parseInt(matchEpisode[1]);
                    const now = Date.now();
                    const nowIsBefore = timestamp * 1000 > now;
                    const episodeIsLessThanAnHourAgo =
                        (timestamp * 1000 - now) < HOUR_TIME_IN_MS;
                    if (!nowIsBefore && episodeIsLessThanAnHourAgo) {
                        episode--;
                        timestamp -= WEEK_TIME;
                    }
                    await interaction.editReply(
                        `Episode ${episode} of ${anime.name} <t:${timestamp}:R> on <t:${timestamp}:f>`,
                    );
                } catch (error) {
                    console.error(new Date(), anime.commandName);
                    console.error(error);
                }
            },
        };
        result.push(command);
    }
    return result;
}
