import messageHandler from '../../misc/messageHandler.js';
import config from '../../config.js';
import { CommandInteractionHandle } from '../../interactions/interactionHandles';
import { SlashCommandStringOption } from '@discordjs/builders';
import { ApplicationCommand, CommandInteraction } from 'discord.js';


export default class Help extends CommandInteractionHandle {
  commands: CommandInteractionHandle[];
  constructor() {
    super(
      'help',
      ()=>languageHandler.language.commands.help.description,
      'help\nhelp signup',
      'Misc',
      `help [${languageHandler.language.commands.help.labels.command.toLowerCase()}]`,
      [new SlashCommandStringOption().setName('command').setDescription(languageHandler.language.commands.help.options.command).setRequired(false)]
    );
  }

  init(commands: CommandInteractionHandle[]) {
    this.commands = commands;
  }

  override async handle(interaction: CommandInteraction) {
    const command = interaction.options.getString('command', false);

    if (command) {
      const commandHandle = this.commands.find((c: CommandInteractionHandle)=> command.startsWith(c.command));
      if (commandHandle) {
        const discordCommand = (await interaction.guild.commands.fetch()).find((appCommand)=> appCommand.name === this.command);
        if(!discordCommand) {
          interaction.reply(await messageHandler.getRichTextExplicitDefault({
            guild: interaction.guild,
            author: interaction.user,
            title: 'Help Info',
            categories: [{
              title: 'Info',
              text: languageHandler.replaceArgs(languageHandler.language.commands.help.error.unknown, [config.botPrefix])
            }],
          }));
          return;
        }
        const example = '\`\`\`' + config.botPrefix +
            commandHandle.example
                .split('\n')
                .reduce((acc, val) => acc + '\`\`\`\n\`\`\`' + config.botPrefix + val) + '\`\`\`';

         interaction.reply(await messageHandler.getRichTextExplicitDefault({
            guild: interaction.guild,
            author: interaction.user,
            categories: [{
              title: languageHandler.language.commands.help.labels.command,
              text: `\`${config.botPrefix}${commandHandle.command}\``,
              inline: true,
            },
            {
              title: languageHandler.language.general.description,
              text: commandHandle.description(),
              inline: true,
            },
            {
              title: languageHandler.language.general.usage,
              text: `\`\`\`${config.botPrefix}${commandHandle.usage}\`\`\``,
            },
            {
              title: languageHandler.language.general.example,
              text: example,
            },
            ],
        }));
      } else {
        interaction.reply(await messageHandler.getRichTextExplicitDefault({
          guild: interaction.guild,
          author: interaction.user,
          title: 'Help Info',
          categories: [{
            title: 'Info',
            text: languageHandler.replaceArgs(languageHandler.language.commands.help.error.unknown, [config.botPrefix])
          }],
        }));

      }
      return;
    }

    const categories: Map<string, string[]> = new Map();
    this.commands.forEach(async (cmd) => {
      const discordCommand = (await interaction.guild.commands.fetch()).find((appCommand)=> appCommand.name === this.command);
      if(discordCommand) {
        if (categories.has(cmd.category)) {
          categories.get(cmd.category).push(cmd.command);
        } else {
          categories.set(cmd.category, new Array(cmd.command));
        }
      }
    });
    const embededCategories: {title: string, text: string, inline?: boolean}[] =[{
      title: 'Info',
      text: languageHandler.replaceArgs(languageHandler.language.commands.help.success.type, [config.botPrefix, languageHandler.language.commands.help.labels.command]),
    }];
    categories.forEach((value, key, map) => {
      const commands = '\`' + config.botPrefix + value
          .reduce((acc, val) => acc + '\`\n\`' + config.botPrefix + val) + '\`';
      embededCategories.push({
        title: key,
        text: commands,
        inline: true,
      });
    });
    interaction.reply(await messageHandler.getRichTextExplicitDefault({
      guild: interaction.guild,
      author: interaction.user,
      title: 'Help Info',
      categories: embededCategories,
      color: 0x616161
    }));
  }
}