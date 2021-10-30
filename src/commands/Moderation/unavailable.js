import {dic as language, replaceArgs} from '../../misc/languageHandler';
import Command from '../command';
import {Message} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import sqlHandler from '../../misc/sqlHandler';
import config from '../../config';
import dateHandler from '../../misc/dateHandler';

export default class Unavailable extends Command {
  constructor(category) {
    super(category);
    this.usage = `unavailable <eventName> <date> <CET/CEST Time>`;
    this.command = 'unavailable';
    this.description = () => replaceArgs(language.commands.unavailable.description, [config.botPrefix]);
    this.example = 'unavailable "Everfall Push" 14.10.2021 12:00';
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
      let eventTimestamp;
      try {
        const eventDate = dateHandler.getUTCDateFromCETStrings(args[1], args[2]);
        eventTimestamp = dateHandler.getUTCTimestampFromDate(eventDate);
      } catch (err) {
        messageHandler.sendRichTextDefault({
          msg: msg,
          title: language.commands.unavailable.error.formatTitle,
          description: language.commands.unavailable.error.formatDesc,
          color: 0xcc0000,
        });
        return;
      }
      const eventId = await sqlHandler.getEventId(args[0], eventTimestamp);
      if (eventId) {
        const result = await Promise.all((await sqlHandler.getUnavailables(eventId))
            .map(async (val)=> {
              const guildMember = await msg.guild.members.fetch(val);
              return guildMember.nickname?guildMember.nickname:guildMember.user.name;
            }))
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
