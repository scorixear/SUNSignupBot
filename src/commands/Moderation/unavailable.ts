import {CommandInteraction, Message} from 'discord.js';
import messageHandler from '../../misc/messageHandler';
import config from '../../config';
import dateHandler from '../../misc/dateHandler';
import { CommandInteractionHandle } from '../../interactions/interactionHandles';
import { SlashCommandStringOption } from '@discordjs/builders';

export default class Unavailable extends CommandInteractionHandle {
  constructor() {
    const commandOptions: any[] = [];
    commandOptions.push(new SlashCommandStringOption().setName('event_name').setDescription(languageHandler.language.commands.signup.options.event_name).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_date').setDescription(languageHandler.language.commands.signup.options.event_date).setRequired(true));
    commandOptions.push(new SlashCommandStringOption().setName('event_time').setDescription(languageHandler.language.commands.signup.options.event_time).setRequired(true));
    super(
      'unavailable',
      ()=>languageHandler.replaceArgs(languageHandler.language.commands.unavailable.description, [config.botPrefix]),
      'unavailable "Everfall Push" 14.10.2021 12:00',
      'Moderation',
      'unavailable <eventName> <date> <CET/CEST Time>',
      commandOptions
    );
  }

  override async handle(interaction: CommandInteraction) {
    const eventName = interaction.options.getString('event_name');
    const eventDate = interaction.options.getString('event_date');
    const eventTime = interaction.options.getString('event_time');
    let eventTimestamp;
    try {
      const date = dateHandler.getUTCDateFromCETStrings(eventDate, eventTime);
      eventTimestamp = dateHandler.getUTCTimestampFromDate(date);
      if (isNaN(eventTimestamp)) {
        interaction.reply(await messageHandler.getRichTextExplicitDefault({
          guild: interaction.guild,
          author: interaction.user,
          title: languageHandler.language.commands.deletesignup.error.formatTitle,
          description: languageHandler.language.commands.deletesignup.error.formatDesc,
          color: 0xcc0000,
        }));
        return;
      }
    } catch (err) {
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.unavailable.error.formatTitle,
        description: languageHandler.language.commands.unavailable.error.formatDesc,
        color: 0xcc0000,
      }));
      return;
    }
    const eventId = await sqlHandler.getEventId(eventName, eventTimestamp.toString());
    if (eventId) {
      const result = (await Promise.all((await sqlHandler.getUnavailables(eventId))
          .map(async (val)=> {
            const guildMember = await interaction.guild.members.fetch(val.toString());
            return guildMember.nickname?guildMember.nickname:guildMember.user.username;
          })))
          .join('\n');
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.unavailable.success.title,
        description: result,
      }));
    } else {
      interaction.reply(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        author: interaction.user,
        title: languageHandler.language.commands.unavailable.error.sql_title,
        description: languageHandler.language.commands.unavailable.error.sql_desc,
        color: 0xcc0000,
      }));
    }
  }
}