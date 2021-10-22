import config from '../../config.js';
import Command from '../command.js';
import {Message, MessageActionRow, MessageButton, TextChannel} from 'discord.js';
import {dic as language, replaceArgs} from '../../misc/languageHandler.js';
import messageHandler from '../../misc/messageHandler.js';
import discordHandler from '../../misc/discordHandler.js';
import sqlHandler from '../../misc/sqlHandler.js';

/**
 *
 * @param {string} eventId
 * @param {string} role
 * @param {string} name
 * @param {Boolean} signup
 */
export async function updateSignupMessage(eventId, role, name, signup) {
  const eventMessage = await sqlHandler.getMessageEvent(eventId);
  const guild = await discordHandler.client.guilds.cache.get(eventMessage.guildId);
  if (guild) {
    const channel = await guild.channels.fetch(eventMessage.channelId);
    if (channel) {
      const msg = await channel.messages.fetch(eventMessage.messageId);
      if (msg) {
        const embed = msg.embeds[0];
        const signupValue = parseInt(embed.fields[2].value);
        embed.fields[2].value = (signupValue+(signup?1:-1)).toString();
        switch (role) {
          case 'Tank':
            updateCategory(name, embed, 3, 'Tanks (', signup);
            break;
          case 'Healer':
            updateCategory(name, embed, 4, 'Healers (', signup);
            break;
          case 'Melee':
            updateCategory(name, embed, 5, 'Melees (', signup);
            break;
          case 'Range':
            updateCategory(name, embed, 6, 'Ranged (', signup);
            break;
        }
        msg.edit({embeds: [embed], components: msg.components});
      }
    }
  }
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

function updateCategory(name, embed, index, categoryName, isSignup) {
  const embedName = embed.fields[index].name.slice(categoryName.length, embed.fields[index].name.length-2);
  let values;
  if (embed.fields[index].value === '\u200b') {
    values = [];
  } else {
    values = embed.fields[index].value.split('\n');
  }
  inserOrRemoveFromArray(values, '- '+name, isSignup);
  embed.fields[index].name = categoryName + (isSignup?parseInt(embedName)+1:parseInt(embedName)-1)+'):';
  if (values.join('\n')==='') {
    values.push('\u200b');
  }
  embed.fields[index].value = values.join('\n');
}

function inserOrRemoveFromArray(array, value, insert) {
  const index = array.indexOf(value);
  if (insert && index === -1) {
    array.push(value);
  } else if (!insert && index !== -1) {
    array.splice(index, 1);
  }
}

export default class Signup extends Command {
  /**
   *  Standard inizialization
   * @param {string} category category this command will be placed under in the help function
   */
  constructor(category) {
    super(category);
    this.usage = `signup <#channel> <eventName> <date> <UTC Time> <Description>`;
    this.command = 'signup';
    this.description = () => language.commands.signup.description;
    this.example = 'signup #announcements "Everfall Push" 14.10.2021 12:00 "Sign up for Everfall Push"';
    this.permissions = ['MANAGE_CHANNELS'];
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
      let eventDate;
      try {
        const dateStrings = args[2].split('.');
        const timeStrings = args[3].split(':');
        eventDate = Math.floor(new Date(parseInt(dateStrings[2]), parseInt(dateStrings[1]), parseInt(dateStrings[0]), parseInt(timeStrings[0]), parseInt(timeStrings[1])).getTime() / 1000);
      } catch (err) {
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

      const eventId = await sqlHandler.createEvent(args[1], eventDate);
      if (eventId === -1) {
        console.error('Failed to load event id with values: ', args[1], eventDate);
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
            text: args[2],
            inline: true,
          },
          {
            title: 'Time',
            text: args[3]+ ' UTC',
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
      console.log(`Created Event ${args[1]} ${eventDate}`);
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
