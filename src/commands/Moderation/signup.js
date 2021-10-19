import cmdHandler from '../../misc/commandHandler.js';
import permHandler from '../../misc/permissionHandler.js';
import config from '../../config.js';
import Command from '../command.js';
import {Message, MessageActionRow, MessageButton, TextChannel} from 'discord.js';
import {dic as language, replaceArgs} from '../../misc/languageHandler.js';
import messageHandler from '../../misc/messageHandler.js';
import discordHandler from '../../misc/discordHandler.js';

export default class Signup extends Command {
  constructor(category) {
    super(category);
    this.usage = `signup #channel`;
    this.command = 'signup';
    this.description = () => language.commands.signup.description;
    this.example = 'signup #announcements';
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

    if (args.length === 1) {
      /** @type { TextChannel } */
      const channel = msg.guild.channels.cache.get(args[0].substr(2, args[0].length - 3));
      if (!channel.isText()) {
        messageHandler.sendRichTextDefault({
          msg: msg,
          title: language.commands.signup.error.voiceTitle,
          descriptionc: language.command.signup.error.voiceDescription,
          color: 0xcc0000,
        });
      }

      const filteredMessages = (await channel.messages.fetch()).filter((message) => message.author.id === config.clientId);
      if (filteredMessages.size > 0) {
        filteredMessages.first().delete();
      }

      const row = new MessageActionRow()
          .addComponents(
              new MessageButton()
                  .setCustomId('signup-1')
                  .setLabel('Sign up')
                  .setStyle('SUCCESS'),
              new MessageButton()
                  .setCustomId('signout-1')
                  .setLabel('Sign out')
                  .setStyle('DANGER'),
          );
      messageHandler.sendRichTextDefaultExplicit({
        guild: msg.guild,
        channel: channel,
        author: msg.author,
        title: 'WAR Signup',
        description: 'Click on the Signup button and follow the Bots instructions.',
        buttons: row,
      });
    } else {
      messageHandler.sendRichTextDefault({
        msg: msg,
        title: language.commands.signup.error.missing_arguments_title,
        description: replaceArgs(language.commands.signup.error.missing_arguments, [config.botPrefix]),
        color: 0xcc0000,
      });
    }
  }
}
