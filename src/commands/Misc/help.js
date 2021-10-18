import cmdHandler from '../../misc/commandHandler.js';
import msgHandler from '../../misc/messageHandler.js';
import permHandler from '../../misc/permissionHandler.js';
import config from '../../config.js';
import Command from '../command.js';
import {Message} from 'discord.js';
import {dic as language, replaceArgs} from '../../misc/languageHandler.js';

export default class Help extends Command {
  constructor(category) {
    super(category);
    this.usage = `help [${language.commands.help.labels.command.toLowerCase()}]`;
    this.command = 'help';
    this.description = () => language.commands.help.description;
    this.example = 'help\nhelp hi';
  }
  /**
   * Executes the command
   * @param {Array<String>} args the arguments fo the msg
   * @param {Message} msg the msg object
   * @param {*} params added parameters and their argument
   */
  executeCommand(args, msg, params) {
    try {
      super.executeCommand(args, msg, params);
    } catch (err) {
      return;
    }
    if (args && args.length > 0) {
      const command = cmdHandler.commands.find((v) => v.command == args[0]);
      if (command) {
        if (permHandler.checkPermissionSilent(command.permissions, msg) === false) {
          msgHandler.sendRichText(msg, 'Help Info', [{
            title: 'Info',
            text: replaceArgs(language.commands.help.error.unknown, [config.botPrefix]),
          }]);
          return;
        }
        const example = '\`\`\`' + config.botPrefix +
            command.example
                .split('\n')
                .reduce((acc, val) => acc + '\`\`\`\n\`\`\`' + config.botPrefix + val) + '\`\`\`';
        msgHandler.sendRichTextDefault({
          msg: msg,
          categories: [{
            title: language.commands.help.labels.command,
            text: `\`${config.botPrefix}${command.command}\``,
            inline: true,
          },
          {
            title: language.general.description,
            text: command.description(),
            inline: true,
          },
          {
            title: language.general.usage,
            text: `\`\`\`${config.botPrefix}${command.usage}\`\`\``,
          },
          {
            title: language.general.example,
            text: example,
          },
          ],
        });
      } else {
        msgHandler.sendRichText(msg, 'Help Info', [{
          title: 'Info',
          text: replaceArgs(language.commands.help.error.unknown, [config.botPrefix]),
        }]);
      }
      return;
    }

    const categories = new Map();
    cmdHandler.commands.forEach((cmd) => {
      if (permHandler.checkPermissionSilent(cmd.permissions, msg)) {
        if (categories.has(cmd.category)) {
          categories.get(cmd.category).push(cmd.command);
        } else {
          categories.set(cmd.category, new Array(cmd.command));
        }
      }
    });
    const embededCategories = new Array({
      title: 'Info',
      text: replaceArgs(language.commands.help.success.type, [config.botPrefix, language.commands.help.labels.command]),
    });
    categories.forEach((value, key, map) => {
      const commands = '\`' + config.botPrefix + value
          .reduce((acc, val) => acc + '\`\n\`' + config.botPrefix + val) + '\`';
      embededCategories.push({
        title: key,
        text: commands,
        inline: true,
      });
    });
    msgHandler.sendRichText(msg, 'Help Info', embededCategories, 0x616161);
  }
}
