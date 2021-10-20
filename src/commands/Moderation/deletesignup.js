import {dic as language, replaceArgs} from '../../misc/languageHandler';
import Command from '../command';
import {Message} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import sqlHandler from '../../misc/sqlHandler';
import config from '../../config';

export default class Deletesignup extends Command {
  constructor(category) {
    super(category);
    this.usage = `deletesignup <eventName> <date> <UTC Time>`;
    this.command = 'deletesignup';
    this.description = () => replaceArgs(language.commands.deletesignup.description, [config.botPrefix]);
    this.example = 'deletesignup "Everfall Push" 14.10.2021 12:00';
    this.permissions = ['MANAGE_CHANNELS'];
  }

  /**
   *
   * @param {Array<String>} args
   * @param {Message} msg
   * @param {*} params
   */
  async executeCommand(args, msg, params) {
    try {
      super.executeCommand(args, msg, params);
    } catch (err) {
      return;
    }

    if (args.length === 3) {
      const dateStrings = args[1].split('.');
      const timeStrings = args[2].split(':');
      const eventDate = Math.floor(new Date(parseInt(dateStrings[2]), parseInt(dateStrings[1]), parseInt(dateStrings[0]), parseInt(timeStrings[0]), parseInt(timeStrings[1])).getTime() / 1000);

      if (await sqlHandler.deleteEvent(args[0], eventDate)) {
        messageHandler.sendRichTextDefault({
          msg: msg,
          title: language.commands.deletesignup.success.title,
          description: replaceArgs(language.commands.deletesignup.success.desc, [args[0]]),
          color: 0x00cc00,
        });
      } else {
        messageHandler.sendRichTextDefault({
          msg: msg,
          title: language.commands.deletesignup.error.sql_title,
          description: language.commands.deletesignup.error.sql_desc,
          color: 0xcc0000,
        });
      }
    } else {
      messageHandler.sendRichTextDefault({
        msg: msg,
        title: language.commands.deletesignup.error.args_title,
        description: replaceArgs(language.commands.deletesignup.error.args_desc, [config.botPrefix]),
        color: 0xcc0000,
      });
    }
  }
}
