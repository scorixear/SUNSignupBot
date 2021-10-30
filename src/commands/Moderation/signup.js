import config from '../../config.js';
import Command from '../command.js';
import {Message, MessageActionRow, MessageButton, TextChannel, Permissions} from 'discord.js';
import {dic as language, replaceArgs} from '../../misc/languageHandler.js';
import messageHandler from '../../misc/messageHandler.js';
import discordHandler from '../../misc/discordHandler.js';
import sqlHandler from '../../misc/sqlHandler.js';
import dateHandler from '../../misc/dateHandler.js';
import sheetHelper from '../../interactions/sheetHelper.js';


/**
 *
 * @param {string} eventId
 * @param {string} role
 * @param {string} name
 * @param {Boolean} signup
 */
export async function updateSignupMessage(eventId) {
  const eventMessage = await sqlHandler.getMessageEvent(eventId);
  try {
    const guild = await discordHandler.client.guilds.cache.get(eventMessage.guildId);
    try {
      const channel = await guild.channels.fetch(eventMessage.channelId);
      try {
        const msg = await channel.messages.fetch(eventMessage.messageId);
        const embed = msg.embeds[0];
        const signups = await sqlHandler.getSignups(eventId);

        const players = await sheetHelper.getSheetData();
        const tanks = []; const healers = []; const melees = []; const ranged = [];
        for (const userId of signups) {
          const member = await guild.members.fetch(userId);
          let username;
          if (member) {
            username = member.nickname ? member.nickname:member.user.username;
          } else {
            username = playerData[0];
          }
          const playerData = players.find((subarray)=> subarray[1]=== userId);
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

export async function updateUnavailable(eventId, isUnavailable) {
  const eventMessage = await sqlHandler.getMessageEvent(eventId);
  const guild = await discordHandler.client.guilds.resolve(eventMessage.guildId);
  if (guild) {
    const channel = await guild.channels.resolve(eventMessage.channelId);
    if (channel) {
      const msg = await channel.messages.resolve(eventMessage.messageId);
      if (msg) {
        const embed = msg.embeds[0];
        embed.fields[7].value = (parseInt(embed.fields[7].value)+(isUnavailable?1:-1)).toString();
        msg.edit({embeds: [embed], components: msg.components});
      }
    }
  }
}
export default class Signup extends Command {
  /**
   *  Standard inizialization
   * @param {string} category category this command will be placed under in the help function
   */
  constructor(category) {
    super(category);
    this.usage = `signup <#channel> <eventName> <date> <CET/CEST Time> <Description>`;
    this.command = 'signup';
    this.description = () => language.commands.signup.description;
    this.example = 'signup #announcements "Everfall Push" 14.10.2021 12:00 "Sign up for Everfall Push"';
  }
  /**
   * Executes the command
   * @param {Array<String>} args the arguments fo the msg
   * @param {Message} msg the msg object
   * @param {*} params added parameters and their argument
   */
  async executeCommand(args, msg, params) {
    try {
      super.executeCommand(args, msg, params);
    } catch (err) {
      return;
    }

    // If channel argument was given
    if (args.length === 5) {
      // Estract channel from the guild cache
      /** @type { TextChannel } */
      const channel = msg.guild.channels.cache.get(args[0].substr(2, args[0].length - 3));
      let eventTimestamp;
      let [dateString, timeString] = [];
      try {
        const eventDate = dateHandler.getUTCDateFromCETStrings(args[2], args[3]);
        eventTimestamp = dateHandler.getUTCTimestampFromDate(eventDate);
        [dateString, timeString] = dateHandler.getCESTStringFromDate(eventDate);
      } catch (err) {
        console.error(err);
        messageHandler.sendRichTextDefault({
          msg: msg,
          title: language.commands.signup.error.formatTitle,
          description: language.commands.signup.error.formatDesc,
          color: 0xcc0000,
        });
        return;
      }

      // if selected channel is not a channel or a voice channel
      if (!channel || !channel.isText()) {
        messageHandler.sendRichTextDefault({
          msg: msg,
          title: language.commands.signup.error.voiceTitle,
          description: language.commands.signup.error.voiceDescription,
          color: 0xcc0000,
        });
        return;
      }

      const eventId = await sqlHandler.createEvent(args[1], eventTimestamp);
      if (eventId === -1) {
        console.error('Failed to load event id with values: ', args[1], eventTimestamp);
        messageHandler.sendRichTextDefault({
          msg: msg,
          title: language.commands.signup.error.eventTitle,
          description: replaceArgs(language.commands.signup.error.eventDesc, [args[1], args[2] + ' ' + args[3], config.botPrefix]),
          color: 0xcc0000,
        });
        return;
      }

      // Create two Buttons for the signup message
      const row = new MessageActionRow()
          .addComponents(
              new MessageButton()
                  .setCustomId('signup-1'+eventId)
                  .setLabel('Sign up')
                  .setStyle('SUCCESS'),
              new MessageButton()
                  .setCustomId('signout-1'+eventId)
                  .setLabel('Sign out')
                  .setStyle('DANGER'),
              new MessageButton()
                  .setCustomId('unavailable'+eventId)
                  .setLabel('Unavailable')
                  .setStyle('SECONDARY'),
          );
      // send Signup message
      /** @type {Message} */
      const message = await messageHandler.sendRichTextDefaultExplicit({
        guild: msg.guild,
        channel: channel,
        author: msg.author,
        title: args[1],
        description: args[4],
        categories: [
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
          {
            title: 'Tanks (0):',
            inline: true,
          },
          {
            title: 'Healers (0):',
            inline: true,
          },
          {
            title: 'Melees (0):',
            inline: true,
          },
          {
            title: 'Ranged (0):',
            inline: true,
          },
          {
            title: 'Unavailable',
            text: '0',
          },
        ],
        buttons: row,
      });
      await sqlHandler.createMessageEvent(eventId, message.id, channel.id, message.guild.id);
      console.log(`Created Event ${args[1]} ${eventTimestamp}`);
    } else {
      // otherwise, send error message that we are missing arguments
      messageHandler.sendRichTextDefault({
        msg: msg,
        title: language.commands.signup.error.missing_arguments_title,
        description: replaceArgs(language.commands.signup.error.missing_arguments, [config.botPrefix]),
        color: 0xcc0000,
      });
    }
  }
}
