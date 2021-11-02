import config from '../../config.js';
import messageHandler from '../../misc/messageHandler.js';
import dateHandler from '../../misc/dateHandler.js';
import { CommandInteraction, TextChannel, MessageActionRow, MessageButton } from 'discord.js';
import { CommandInteractionHandle } from '../../interactions/interactionHandles';
import {  SlashCommandChannelOption, SlashCommandStringOption } from '@discordjs/builders';
import { ChannelType } from 'discord-api-types';
import {roleOptions} from '../../interactions/signupConfig';
import sheetHelper from '../../interactions/sheetHelper';

/**
 *
 * @param eventId
 */
 export async function updateSignupMessage(eventId: string) {
  const eventMessage = await global.sqlHandler.getMessageEvent(eventId);
  try {
    const guild = global.discordHandler.client.guilds.cache.get(eventMessage.guildId);
    try {
      const channel = await guild.channels.fetch(eventMessage.channelId) as TextChannel;
      try {
        const msg = await channel.messages.fetch(eventMessage.messageId);
        const embed = msg.embeds[0];
        const signups = await global.sqlHandler.getSignups(eventId);

        const players: string[][] = await sheetHelper.getSheetData();
        const tanks = []; const healers = []; const melees = []; const ranged = [];
        for (const userId of signups) {
          const member = await guild.members.fetch(userId);
          let username;
          const playerData = players.find((subarray)=> subarray[1]=== userId);
          if (member) {
            username = member.nickname ? member.nickname:member.user.username;
          } else {
            username = playerData[0];
          }

          switch (playerData[4]) {
            case 'Melee':
              melees.push(username);
              break;
            case 'Tank':
              tanks.push(username);
              break;
            case 'Healer':
              healers.push(username);
              break;
            case 'Range':
              ranged.push(username);
              break;
          }
        }

        embed.fields[2].value = signups.length.toString();
        embed.fields[3].name = `Tanks (${tanks.length}):`;
        embed.fields[3].value = tanks.length>0?tanks.join('\n'):'\u200b';
        embed.fields[4].name = `Healers (${healers.length}):`;
        embed.fields[4].value = healers.length>0?healers.join('\n'):'\u200b';
        embed.fields[5].name = `Melees (${melees.length}):`;
        embed.fields[5].value = melees.length>0?melees.join('\n'):'\u200b';
        embed.fields[6].name = `Ranged (${ranged.length}):`;
        embed.fields[6].value = ranged.length>0?ranged.join('\n'):'\u200b';
        msg.edit({embeds: [embed], components: msg.components});
      } catch (err) {}
    } catch (err) {}
  } catch (err) {}
}

export async function updateUnavailable(eventId: string, isUnavailable: boolean) {
  const eventMessage = await global.sqlHandler.getMessageEvent(eventId);
  try {
    const guild = global.discordHandler.client.guilds.cache.get(eventMessage.guildId);
    try {
      const channel = await guild.channels.fetch(eventMessage.channelId) as TextChannel;
      try {
        const msg = await channel.messages.fetch(eventMessage.messageId);
        if (msg) {
          const embed = msg.embeds[0];
          embed.fields[7].value = (parseInt(embed.fields[7].value, 10)+(isUnavailable?1:-1)).toString();
          msg.edit({embeds: [embed], components: msg.components});
        }
      } catch (err) {}
    } catch (err) {}
  } catch (err) {}
}

export default class SignupCommand extends CommandInteractionHandle {
  constructor() {
    const commandOptions: any[] = [];
    const channelOption: SlashCommandChannelOption = new SlashCommandChannelOption().setName('channel').setDescription(languageHandler.language.commands.signup.options.channel).setRequired(true);
    channelOption.addChannelType(ChannelType.GuildText);
    commandOptions.push(channelOption);
    commandOptions.push(new SlashCommandStringOption().setName('event_name').setDescription(languageHandler.language.commands.signup.options.event_name).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_date').setDescription(languageHandler.language.commands.signup.options.event_date).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_time').setDescription(languageHandler.language.commands.signup.options.event_time).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_description').setDescription(languageHandler.language.commands.signup.options.event_desc).setRequired(true));
    super(
      'signup',
      ()=>global.languageHandler.language.commands.signup.description,
      'signup #announcements "Everfall Push" 14.10.2021 12:00 "Sign up for Everfall Push"',
      'Moderation',
      'signup <#channel> <eventName> <date> <CET/CEST Time> <Description>',
      commandOptions
    );
  }

  override async handle(interaction: CommandInteraction) {
    const channel = interaction.options.getChannel('channel') as TextChannel;
    const eventName = interaction.options.getString('event_name');
    const eventDate = interaction.options.getString('event_date');
    const eventTime = interaction.options.getString('event_time');
    const eventDesc = interaction.options.getString('event_description');
    let eventTimestamp;
    let [dateString, timeString]: string[] = [ undefined, undefined];
    try {
      const date = dateHandler.getUTCDateFromCETStrings(eventDate, eventTime);
      eventTimestamp = dateHandler.getUTCTimestampFromDate(date);
      [dateString, timeString] = dateHandler.getCESTStringFromDate(date);
    } catch (err) {
      console.error(err);
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.signup.error.formatTitle,
        description: languageHandler.language.commands.signup.error.formatDesc,
        color: 0xcc0000,
      }));
      return;
    }

    const eventId = await sqlHandler.createEvent(eventName, eventTimestamp.toString());
    if (eventId === -1) {
      console.error('Failed to load event id with values: ', eventName, eventTimestamp);
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.signup.error.eventTitle,
        description: languageHandler.replaceArgs(languageHandler.language.commands.signup.error.eventDesc, [eventName, eventDate + ' ' + eventTime, config.botPrefix]),
        color: 0xcc0000,
      }));
    }

    // Create two Buttons for the signup message
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('signup'+eventId)
                .setLabel('Sign up')
                .setStyle('SUCCESS'),
            new MessageButton()
                .setCustomId('signout'+eventId)
                .setLabel('Sign out')
                .setStyle('DANGER'),
            new MessageButton()
                .setCustomId('unavailable'+eventId)
                .setLabel('Unavailable')
                .setStyle('SECONDARY'),
        );

    const categories: {title: string, text?: string, inline?: boolean}[]  = [
      {
        title: 'Date',
        text: dateString,
        inline: true,
      },
      {
        title: 'Time',
        text: timeString,
        inline: true,
      },
      {
        title: 'Sign ups',
        text: '0',
        inline: true,
      },
    ];

    for(const roleOption of roleOptions) {
      categories.push({
        title: roleOption.label+ ' (0):',
        inline: true,
      });
    }
    categories.push({
      title: 'Unavailable',
      text: '0',
    });

    // send Signup message
    const message = await messageHandler.sendRichTextDefaultExplicit({
      guild: interaction.guild,
      channel,
      author: interaction.user,
      title: eventName,
      description: eventDesc,
      categories,
      components: [row],
    });
    await sqlHandler.createMessageEvent(eventId.toString(), message.id, channel.id, message.guild.id);
    console.log(`Created Event ${eventName} ${eventTimestamp}`);
  }
}