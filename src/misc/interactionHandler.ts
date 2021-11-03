import { ApplicationCommandPermissionData, ButtonInteraction, CommandInteraction, Interaction, SelectMenuInteraction } from 'discord.js';
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
      ['signup-1', new signup.SignupEvent('signup-1')],
      ['signout-1', new signup.SignoutEvent('signout-1')],
      ['signup-confirmation', new signup.SignupConfirmation('signup-confirmation')],
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
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENTID, guild.id), {body: commands})
      console.log('Successfully registered application commands for guild', guild.id);
      const guildRoles = await guild.roles.fetch();
      const guildCommands = await guild.commands.fetch();
      const signupRoles = guildRoles.filter(role => config.signupRoles.includes(role.name));
      const permissionsObject: ApplicationCommandPermissionData[] = [];
      signupRoles.forEach(role => permissionsObject.push({
        id: role.id,
        type: 'ROLE',
        permission: true,
      }));
      this.commandInteractions.forEach(interaction => {
        if(interaction.requirePermissions) {
          const applicationCommand = guildCommands.find(appCommand => appCommand.name === interaction.command);
          applicationCommand.permissions.set({
            permissions: permissionsObject,
          })
        }
      })
    });


  }

  public async handle(interaction: Interaction) {
    try {
      if (interaction.isButton()) {
        const buttonInteraction: ButtonInteraction = interaction as ButtonInteraction;
        const interactionHandle: ButtonInteractionHandle = this.buttonInteractions.find(id => buttonInteraction.customId.startsWith(id));
        if(interactionHandle) {
          await interactionHandle.handle(buttonInteraction);
        }
      } else if (interaction.isCommand()) {
        const commandInteraction: CommandInteraction = interaction as CommandInteraction;
        const handler = this.commandInteractions.find(interactionHandle => interactionHandle.command === commandInteraction.commandName);
        if (handler) {
          await handler.handle(commandInteraction);
        }
      } else if (interaction.isSelectMenu()) {
        const selectMenuInteraction: SelectMenuInteraction = interaction as SelectMenuInteraction;
        const interactionHandle: SelectMenuInteractionHandle = this.selectMenuInteractions.find(id => selectMenuInteraction.customId.startsWith(id));
        if (interactionHandle) {
          await interactionHandle.handle(selectMenuInteraction);
        }
      } else {
        return;
      }
    } catch (err) {
      console.error('Error handling Interaction', err);
    }

  }
}
