import { ButtonInteraction, CommandInteraction, Interaction, SelectMenuInteraction } from 'discord.js';
import SignupCommand from '../commands/Moderation/signup';
import {ButtonInteractionHandle, SelectMenuInteractionHandle, CommandInteractionHandle} from '../interactions/interactionHandles';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import config from '../config';
import Deletesignup from '../commands/Moderation/deletesignup';
import Unavailable from '../commands/Moderation/unavailable';
import Help from '../commands/Misc/help';
import TwoWayMap from './TwoWayMap';
import signup from '../interactions/signup';
import editHandler from '../interactions/editHandler';


export default class InteractionHandler {
  public buttonInteractions: TwoWayMap<string, ButtonInteractionHandle>;
  public selectMenuInteractions: TwoWayMap<string, SelectMenuInteractionHandle>;
  private commandInteractions: CommandInteractionHandle[];
  constructor() {
    this.buttonInteractions = new TwoWayMap(new Map([
      ['signup', new signup.SignupEvent('signup')],
      ['signout', new signup.SignoutEvent('signout')],
      ['signout-confirmation', new signup.SignupConfirmation('signup-confirmation')],
      ['signup-edit', new signup.SignupEditEvent('signup-edit')],
      ['unavailable', new signup.UnavailableEvent('unavailable')],
    ]));
    this.selectMenuInteractions = new TwoWayMap(new Map([
      ['signup-weapon1', new signup.SignupWeapon1Event('signup-weapon1')],
      ['signup-update-weapon1', new signup.SignupUpdateWeapon1Event('signup-update-weapon1')],
      ['signup-weapon2', new signup.SignupWeapon2Event('signup-weapon2')],
      ['signup-update-weapon2', new signup.SignupUpdateWeapon2Event('signup-update-weapon2')],
      ['signup-role', new signup.SignupRoleEvent('signup-role')],
      ['signup-update-role', new signup.SignupUpdateRoleEvent('signup-update-role')],
      ['signup-guild', new signup.SignupGuildEvent('signup-guild')],
      ['signup-update-guild', new signup.SignupUpdateGuildEvent('signup-update-guild')],
      ['edit-weapon1', new editHandler.EditWeapon1Event('edit-weapon1')],
      ['edit-weapon2', new editHandler.EditWeapon2Event('edit-weapon2')],
      ['edit-role', new editHandler.EditRoleEvent('edit-role')],
      ['edit-guild', new editHandler.EditGuildEvent('edit-guild')],
    ]));

    const help = new Help();
    this.commandInteractions = [
      new SignupCommand(),
      new Deletesignup(),
      new Unavailable(),
      help,
    ];
    help.init(this.commandInteractions);
  }

  public async Init() {
    const commands = this.commandInteractions.map(command => command.slashCommandBuilder.toJSON());
    const rest = new REST( {version: '9'}).setToken(process.env.DISCORD_TOKEN);

    global.discordHandler.client.guilds.cache.forEach(async guild=> {
      console.log('Rest Response:', await rest.put(Routes.applicationGuildCommands(config.clientId, guild.id), {body: commands})
          .then(()=> console.log('Successfully registered application commands for guild', guild.id))
          .catch(console.error));
    });
  }

  public async handle(interaction: Interaction) {
    try {
      if (interaction.isButton()) {
        const buttonInteraction: ButtonInteraction = interaction as ButtonInteraction;
        const key = (Object.keys(this.buttonInteractions) as string[]).find(id => buttonInteraction.customId.startsWith(id));
        console.log(key);
        await this.buttonInteractions.get(key)?.handle(buttonInteraction);
      } else if (interaction.isCommand()) {
        const commandInteraction: CommandInteraction = interaction as CommandInteraction;
        const handler = this.commandInteractions.find(interactionHandle => interactionHandle.command === commandInteraction.commandName);
        if (handler) {
          handler.handle(commandInteraction);
        } else {
          throw new Error('Didn\'t found Interaction ' + commandInteraction.commandName)
        }
      } else if (interaction.isSelectMenu()) {
        const selectMenuInteraction: SelectMenuInteraction = interaction as SelectMenuInteraction;
        const key = (Object.keys(this.selectMenuInteractions) as string[]).find(id => selectMenuInteraction.customId.startsWith(id));
        await this.selectMenuInteractions.get(key)?.handle(selectMenuInteraction);
      } else {
        return;
      }
    } catch (err) {
      console.error('Error handling Interaction', err);
    }

  }
}
