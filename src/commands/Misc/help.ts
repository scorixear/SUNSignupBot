import messageHandler from '../../misc/messageHandler.js';
import config from '../../config.js';
import { CommandInteractionHandle } from '../../interactions/interactionHandles';
import { SlashCommandStringOption } from '@discordjs/builders';
import { ApplicationCommand, CommandInteraction, GuildMember, GuildMemberRoleManager } from 'discord.js';
import { LanguageHandler } from '../../misc/languageHandler.js';

declare const languageHandler: LanguageHandler;

export default class Help extends CommandInteractionHandle {
  commands: CommandInteractionHandle[];
  constructor() {
    super(
      'help',
      ()=>languageHandler.language.commands.help.description,
      'help\nhelp signup',
      'Misc',
      `help [${languageHandler.language.commands.help.labels.command.toLowerCase()}]`,
      [new SlashCommandStringOption().setName('command').setDescription(languageHandler.language.commands.help.options.command).setRequired(false)],
      false
    );
  }

  init(commands: CommandInteractionHandle[]) {
    this.commands = commands;
  }

  override async handle(interaction: CommandInteraction) {
    try {
      await super.handle(interaction);
    } catch(err) {
      return;
    }
    const member = await (interaction.member as GuildMember).fetch();
    const command = interaction.options.getString('command', false);
    const memberRoles = (member.roles as GuildMemberRoleManager).cache;
    if (command) {
      const commandHandle = this.commands.find((c: CommandInteractionHandle)=> command.startsWith(c.command));
      if (commandHandle) {
        let found: boolean = false;
        for (const memberRole of memberRoles.values()) {
          if(config.signupRoles.find((signupRole: string) => signupRole === memberRole.name)) {
            found = true;
            break;
          }
        }
        if(!found) {
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
    for(const cmd of this.commands) {
      let found: boolean = false;
      if(cmd.requirePermissions) {
        for (const memberRole of memberRoles.values()) {
          if(config.signupRoles.find((signupRole: string) => signupRole === memberRole.name)) {
            found = true;
            break;
          }
        }
      } else {
        found = true;
      }
      if(found) {
        if (categories.has(cmd.category)) {
          categories.get(cmd.category).push(cmd.command);
        } else {
          categories.set(cmd.category, new Array(cmd.command));
        }
      }
    }
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