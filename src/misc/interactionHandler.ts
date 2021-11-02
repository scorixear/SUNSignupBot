import { ButtonInteraction, CommandInteraction, Interaction, SelectMenuInteraction } from 'discord.js';
import SignupCommand from '../commands/Moderation/signup';
import {ButtonInteractionHandle, SelectMenuInteractionHandle, CommandInteractionHandle} from '../interactions/interactionHandles';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types';
import config from '../config';


export default class InteractionHandler {
  private buttonInteractions: Record<string, ButtonInteractionHandle>;
  private selectMenuInteractions: Record<string, SelectMenuInteractionHandle>;
  private commandInteractions: Record<string, CommandInteractionHandle>;
  constructor() {
    this.buttonInteractions = {

    };
    this.selectMenuInteractions = {

    };
    this.commandInteractions = {
      signup: new SignupCommand()
    };

    const commands = (Object.values(this.commandInteractions) as Array<CommandInteractionHandle>).map(command => command.slashCommandBuilder.toJSON());
    const rest = new REST( {version: '9'}).setToken(process.env.DISCORD_TOKEN);

    global.discordHandler.client.guilds.cache.forEach(guild=> {
      rest.put(Routes.applicationGuildCommands(config.clientId, guild.id), {body: commands})
          .then(()=> console.log('Successfully registered application commands for guild', guild.id))
          .catch(console.error);
    });

  }

  public async handle(interaction: Interaction) {
    try {
      if(interaction.isButton()) {
        const buttonInteraction: ButtonInteraction = interaction as ButtonInteraction;
        const key = (Object.keys(this.buttonInteractions) as Array<string>).find(key => buttonInteraction.customId.startsWith(key));
        await this.buttonInteractions[key]?.handle(buttonInteraction);
      } else if (interaction.isCommand()) {
        const commandInteraction: CommandInteraction = interaction as CommandInteraction;
        await this.commandInteractions[commandInteraction.commandName]?.handle(commandInteraction);
      } else if (interaction.isSelectMenu()) {
        const selectMenuInteraction: SelectMenuInteraction = interaction as SelectMenuInteraction;
        const key = (Object.keys(this.selectMenuInteractions) as Array<string>).find(key => selectMenuInteraction.customId.startsWith(key));
        await this.selectMenuInteractions[key]?.handle(selectMenuInteraction);
      } else {
        return;
      }
    } catch (err) {
      console.error('Error handling Interaction', interaction, err);
    }
    
  }
}
