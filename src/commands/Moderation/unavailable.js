import {dic as language, replaceArgs} from '../../misc/languageHandler';
import Command from '../command';
import {Message} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import sqlHandler from '../../misc/sqlHandler';
import config from '../../config';

export default class Unavailable extends Command {
  constructor(category) {
    super(category);
    this.usage = `unavailable <eventName> <date> <UTC Time>`;
    this.command = 'unavailable';
    this.description = () => replaceArgs(language.commands.unavailable.description, [config.botPrefix]);
    this.example = 'unavailable "Everfall Push" 14.10.2021 12:00';
    this.permissions = ['MANAGE_MESSAGES'];
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
      let eventDate;
      try {
        const dateStrings = args[1].split('.');
        const timeStrings = args[2].split(':');
        eventDate = Math.floor(new Date(parseInt(dateStrings[2]), parseInt(dateStrings[1]), parseInt(dateStrings[0]), parseInt(timeStrings[0]), parseInt(timeStrings[1])).getTime() / 1000);
      } catch (err) {
        messageHandler.sendRichTextDefault({
          msg: msg,
          title: language.commands.unavailable.error.formatTitle,
          description: language.commands.unavailable.error.formatDesc,
          color: 0xcc0000,
        });
        return;
      }
      const eventId = await sqlHandler.getEventId(args[0], eventDate);
      if (eventId) {
        const result = (await sqlHandler.getUnavailables(eventId))
            .map((val)=> {
              return msg.guild.members.resolve(val).nickname;
            })
            .join('\n');
        messageHandler.sendRichTextDefault({
          msg: msg,
          title: language.commands.unavailable.success.title,
          description: result,
        });
      } else {
        messageHandler.sendRichTextDefault({
          msg: msg,
          title: language.commands.unavailable.error.sql_title,
          description: language.commands.unavailable.error.sql_desc,
          color: 0xcc0000,
        });
      }
    } else {
      messageHandler.sendRichTextDefault({
        msg: msg,
        title: language.commands.unavailable.error.args_title,
        description: replaceArgs(language.commands.unavailable.error.args_desc, [config.botPrefix]),
        color: 0xcc0000,
      });
    }
  }
}
