import {
    CommandInteractionOptionResolver,
    EmbedBuilder,
    GuildMember,
    PermissionFlagsBits,
    PermissionsBitField,
    RoleResolvable,
    SlashCommandBuilder,
    User,
} from 'discord.js';
import { SlashCommand } from '@orsted/utils';
import { setCommandName } from '../../utils/setCommandName.ts';

const donutId = '815600544873578526';
const donutImage =
    'https://media.discordapp.net/attachments/814170478566178879/832430180676272148/latest.png?width=352&height=503';

const donut: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName(setCommandName('donut'))
        .setDescription('Call Papa Orsted to donut somebody (default 10s)')
        .addUserOption((option) =>
            option.setName('target').setDescription('Select a user to donut')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('reason').setDescription('Choose a reason')
        )
        .addNumberOption((option) =>
            option.setName('h').setDescription('Set the amount of hours')
                .setMaxValue(72).setMinValue(0)
        )
        .addNumberOption((option) =>
            option.setName('min').setDescription('Set the amount of minutes')
                .setMaxValue(59).setMinValue(0)
        )
        .addNumberOption((option) =>
            option.setName('sec').setDescription('Set the amount of seconds')
                .setMaxValue(59).setMinValue(0)
        ) as SlashCommandBuilder,
    execute: async (interaction) => {
        try {
            await interaction.deferReply();
            const donutRole = interaction.guild?.roles.cache.get(
                donutId,
            ) as RoleResolvable;
            const options = interaction
                .options as CommandInteractionOptionResolver;
            let target = options.getMember('target') as GuildMember;
            const hour = options.getNumber('h');
            const min = options.getNumber('min');
            const sec = options.getNumber('sec');
            let time = (hour !== null ? hour * 3600 : 0) +
                (min !== null ? min * 60 : 0) + (sec !== null ? sec : 0);
            time = time === 0 ? 10 : time;
            let reason = options.getString('reason');
            if (
                !(interaction.memberPermissions as PermissionsBitField).has(
                    PermissionFlagsBits.KickMembers,
                )
            ) {
                target = interaction.member as GuildMember;
                reason = 'Trying to donut without permission';
            }
            if (target.id === (interaction.client.user as User).id) {
                target = interaction.member as GuildMember;
                reason = `Trying to donut Papa Orsted`;
            }
            const msgEmbed = new EmbedBuilder().setTitle('Donut');
            if (reason !== null || Math.floor(Math.random() * 10) !== 0) {
                target.roles.add(donutRole);
                msgEmbed.setDescription(
                    `${target} has been donut! Duration: ${
                        hour !== null ? `${hour}h ` : ''
                    }${min !== null ? `${min}m ` : ''}${
                        sec !== null ? `${sec}s` : ''
                    }${time === 10 ? '10s' : ''}`,
                ).setFooter({ text: `Reason: ${reason}` });
                await interaction.editReply({ embeds: [msgEmbed] });
                setTimeout(async () => {
                    target.roles.remove(donutRole);
                    const msgEmbed2 = new EmbedBuilder().setDescription(
                        `${target} has revived!`,
                    );
                    await interaction.followUp({ embeds: [msgEmbed2] });
                }, time * 1000);
            } else {
                msgEmbed.setDescription(`${target} has been spared!`).setImage(
                    donutImage,
                );
                await interaction.editReply({ embeds: [msgEmbed] });
            }
        } catch (error) {
            console.error(new Date(Date.now()), 'donut');
            console.error(error);
        }
    },
};

export default donut;
