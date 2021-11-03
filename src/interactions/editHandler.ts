import {ButtonInteraction, MessageSelectMenu, DMChannel, MessageActionRow, SelectMenuInteraction, Message, TextBasedChannels} from 'discord.js';
import messageHandler from '../misc/messageHandler';
import {weaponOptions, roleOptions, guildOptions} from './signupConfig';
import config from '../config';
import sheetHelper from './sheetHelper';
import messageCollectorHandler from './messageCollectorHandler';
import { ButtonInteractionHandle, SelectMenuInteractionHandle } from './interactionHandles';
import { LanguageHandler } from '../misc/languageHandler';
import InteractionHandler from '../misc/interactionHandler';

declare const languageHandler: LanguageHandler;
declare const interactionHandler: InteractionHandler;

/**
 * Called to collect name
 */
async function editName(channel: TextBasedChannels, event: string, player: string[], playerIndex: number, userId: string) {
  // send "get name" message to user
  const message = await channel.send(await messageHandler.getRichTextExplicitDefault({
    title: languageHandler.language.interactions.signup.edit.name_title,
    description: languageHandler.language.interactions.signup.edit.name_desc,
  }));

  messageCollectorHandler.createMessageCollector(
      channel,
      message,
      languageHandler.language.interactions.signup.edit.error.name_timeout_desc,
      async (msg)=>{
        await sheetHelper.updateCellInSheet([0, msg.content], event, channel, player, playerIndex);
      },
      userId,
  );
}

/**
 * Called to collect weapon 1
 */
async function editWeapon1(channel: TextBasedChannels, event: string) {
  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId(interactionHandler.selectMenuInteractions.typeGet(EditWeapon1Event)+event)
              .setPlaceholder('Nothing selected')
              .addOptions(weaponOptions),
      );
  // send message to select first Weapon
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: languageHandler.language.interactions.signup.edit.weapon1_title,
    description: languageHandler.language.interactions.signup.edit.weapon1_desc,
    components: [row],
  }));
}

class EditWeapon1Event extends SelectMenuInteractionHandle {
  override async handle(interaction: SelectMenuInteraction) {
    super.handle(interaction);
    const value = interaction.values[0];
    (interaction.message as Message).delete();
    // interactionsHelper.deleteLastMessage(interaction.channel);
    const [playerIndex, player]= await sheetHelper.getIndexAndRowFromSheet(interaction.user.id);
    await sheetHelper.updateCellInSheet([2, value], interaction.customId.slice(this.id.length), interaction.channel, player, playerIndex);
  }
}

/**
 * called to select weapon 2
 */
async function editWeapon2(channel: TextBasedChannels, event: string) {
  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId(interactionHandler.selectMenuInteractions.typeGet(EditWeapon2Event)+event)
              .setPlaceholder('Nothing selected')
              .addOptions(weaponOptions),
      );
  // send message to select first Weapon
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: languageHandler.language.interactions.signup.edit.weapon2_title,
    description: languageHandler.language.interactions.signup.edit.weapon2_desc,
    components: [row],
  }));
}

class EditWeapon2Event extends SelectMenuInteractionHandle {
  override async handle(interaction: SelectMenuInteraction) {
    super.handle(interaction);
    const value = interaction.values[0];
    (interaction.message as Message).delete();
    // interactionsHelper.deleteLastMessage(interaction.channel);
    const [playerIndex, player] = await sheetHelper.getIndexAndRowFromSheet(interaction.user.id);
    await sheetHelper.updateCellInSheet([3, value], interaction.customId.slice(this.id.length), interaction.channel, player, playerIndex);
  }
}

/**
 * Called to select Role
 */
async function editRole(channel: TextBasedChannels, event: string) {
  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId(interactionHandler.selectMenuInteractions.typeGet(EditRoleEvent)+event)
              .setPlaceholder('Nothing selected')
              .addOptions(roleOptions),
      );
  // send message to select first Weapon
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: languageHandler.language.interactions.signup.edit.role_title,
    description: languageHandler.language.interactions.signup.edit.role_desc,
    components: [row],
  }));
}

class EditRoleEvent extends SelectMenuInteractionHandle {
  override async handle(interaction: SelectMenuInteraction) {
    super.handle(interaction);
    const value = interaction.values[0];
    (interaction.message as Message).delete();
    // interactionsHelper.deleteLastMessage(interaction.channel);
    const [playerIndex, player] = await sheetHelper.getIndexAndRowFromSheet(interaction.user.id);
    await sheetHelper.updateCellInSheet([4, value], interaction.customId.slice(this.id.length), interaction.channel, player, playerIndex);
  }
}

/**
 * Called to select Guild
 */
async function editGuild(channel: TextBasedChannels, event: string) {
  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId(interactionHandler.selectMenuInteractions.typeGet(EditGuildEvent)+event)
              .setPlaceholder('Nothing selected')
              .addOptions(guildOptions),
      );
  // send message to select first Weapon
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: languageHandler.language.interactions.signup.edit.guild_title,
    description: languageHandler.language.interactions.signup.edit.guild_desc,
    components: [row],
  }));
}

class EditGuildEvent extends SelectMenuInteractionHandle {
  override async handle(interaction: SelectMenuInteraction) {
    super.handle(interaction);
    const value = interaction.values[0];
    (interaction.message as Message).delete();
    // interactionsHelper.deleteLastMessage(interaction.channel);
    const [playerIndex, player] = await sheetHelper.getIndexAndRowFromSheet(interaction.user.id);
    await sheetHelper.updateCellInSheet([5, value], interaction.customId.slice(this.id.length), interaction.channel, player, playerIndex);
  }
}


/**
 * Called to select Level
 */
async function editLevel(channel: TextBasedChannels, event: string, player: string[], playerIndex: number, userId: string) {
  // send "get name" message to user
  const message = await channel.send(await messageHandler.getRichTextExplicitDefault({
    title: languageHandler.language.interactions.signup.edit.level_title,
    description: languageHandler.language.interactions.signup.edit.level_desc,
  }));

  messageCollectorHandler.createMessageCollector(
      channel,
      message,
      languageHandler.language.interactions.signup.edit.error.level_timeout_desc,
      async (msg)=>{
        await sheetHelper.updateCellInSheet([6, msg.content], event, channel, player, playerIndex);
      },
      userId,
  );
}

/**
 * Called to select Gearscore
 */
async function editGearscore(channel: TextBasedChannels, event: string, player: string[], playerIndex: number, userId: string) {
  // send "get name" message to user
  const message = await channel.send(await messageHandler.getRichTextExplicitDefault({
    title: languageHandler.language.interactions.signup.edit.gearscore_title,
    description: languageHandler.language.interactions.signup.edit.gearscore_desc,
  }));

  messageCollectorHandler.createMessageCollector(
      channel,
      message,
      languageHandler.language.interactions.signup.edit.error.gearscore_timeout_desc,
      async (msg)=>{
        await sheetHelper.updateCellInSheet([7, msg.content], event, channel, player, playerIndex);
      },
      userId,
  );
}

export default {
  editName,
  editWeapon1,
  EditWeapon1Event,
  editWeapon2,
  EditWeapon2Event,
  editRole,
  EditRoleEvent,
  editGuild,
  EditGuildEvent,
  editLevel,
  editGearscore,
};