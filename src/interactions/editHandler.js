import {ButtonInteraction, MessageSelectMenu, DMChannel, MessageActionRow} from 'discord.js';
import messageHandler from '../misc/messageHandler';
import {dic as language} from '../misc/languageHandler';
import {weaponOptions, roleOptions} from './signupConfig';
import googleSheetsHandler from '../misc/googleSheetsHandler';
import config from '../config';
import sheetHelper from './sheetHelper';
import buttonActionHandler from '../misc/buttonActionHandler';

function init() {
  // called after selecting weapon 1 from single selection
  buttonActionHandler.addButtonAction('edit-weapon1', editWeapon1Event);
  // called after selecting weapon 2 from single selection
  buttonActionHandler.addButtonAction('edit-weapon2', editWeapon2Event);
  // called after selecting role from single selection
  buttonActionHandler.addButtonAction('edit-role', editRoleEvent);
}

/**
 * Called to collect name
 * @param {DMChannel} channel
 * @param {string} event
 * @param {Array} player
 * @param {number} playerIndex
 */
async function editName(channel, event, player, playerIndex) {
  // send "get name" message to user
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.name_title,
    description: language.interactions.signup.edit.name_desc,
  }));
  const collector = channel.createMessageCollector({filter: (m)=>m.author.id != config.clientId, max: 1, time: 50000});
  collector.on('collect', async (msg, c) => {
    await sheetHelper.updateCellInSheet([0, msg.content], event, channel, player, playerIndex);
  });
}

/**
 * Called to collect weapon 1
 * @param {DMChannel} channel
 * @param {string} event
 */
async function editWeapon1(channel, event) {
  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId('edit-weapon1'+event)
              .setPlaceholder('Nothing selected')
              .addOptions(weaponOptions),
      );
  // send message to select first Weapon
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.weapon1_title,
    description: language.interactions.signup.edit.weapon1_desc,
    buttons: row,
  }));
}

/**
 * Called when weapon 1 was selected
 * @param {SelectMenuInteraction} interaction
 */
async function editWeapon1Event(interaction) {
  const value = interaction.values[0];

  const playerData = await googleSheetsHandler.retrieveData(config.googleSheetsId, config.googleSheetsRange);
  const players = playerData.values?playerData.values: [[]];
  let player; let playerIndex; let i=0;
  for (const p of players) {
    if (p[1] === interaction.user.id) {
      player = p;
      playerIndex = i;
      break;
    }
    i++;
  }
  await sheetHelper.updateCellInSheet([2, value], interaction.customId.slice('edit-weapon1'.length), interaction.channel, player, playerIndex);
}

/**
 * called to select weapon 2
 * @param {DMChannel} channel
 * @param {string} event
 */
async function editWeapon2(channel, event) {
  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId('edit-weapon2'+event)
              .setPlaceholder('Nothing selected')
              .addOptions(weaponOptions),
      );
  // send message to select first Weapon
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.weapon2_title,
    description: language.interactions.signup.edit.weapon2_desc,
    buttons: row,
  }));
}

/**
 * called when Weapon 2 was selected
 * @param {SelectMenuInteraction} interaction
 */
async function editWeapon2Event(interaction) {
  const value = interaction.values[0];

  const playerData = await googleSheetsHandler.retrieveData(config.googleSheetsId, config.googleSheetsRange);
  const players = playerData.values?playerData.values: [[]];
  let player; let playerIndex; let i=0;
  for (const p of players) {
    if (p[1] === interaction.user.id) {
      player = p;
      playerIndex = i;
      break;
    }
    i++;
  }
  await sheetHelper.updateCellInSheet([3, value], interaction.customId.slice('edit-weapon2'.length), interaction.channel, player, playerIndex);
}

/**
 * Called to select Role
 * @param {DMChannel} channel
 * @param {string} event
 */
async function editRole(channel, event) {
  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId('edit-role'+event)
              .setPlaceholder('Nothing selected')
              .addOptions(roleOptions),
      );
  // send message to select first Weapon
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.role_title,
    description: language.interactions.signup.edit.role_desc,
    buttons: row,
  }));
}

/**
 * Called when Role was selected
 * @param {SelectMenuInteraction} interaction
 */
async function editRoleEvent(interaction) {
  const value = interaction.values[0];

  const playerData = await googleSheetsHandler.retrieveData(config.googleSheetsId, config.googleSheetsRange);
  const players = playerData.values?playerData.values: [[]];
  let player; let playerIndex; let i=0;
  for (const p of players) {
    if (p[1] === interaction.user.id) {
      player = p;
      playerIndex = i;
      break;
    }
    i++;
  }
  await sheetHelper.updateCellInSheet([4, value], interaction.customId.slice('edit-role'.length), interaction.channel, player, playerIndex);
}

/**
 * Called to select Level
 * @param {DMChannel} channel
 * @param {string} event
 * @param {Array<string>} player
 * @param {number} playerIndex
 */
async function editLevel(channel, event, player, playerIndex) {
  // send "get name" message to user
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.level_title,
    description: language.interactions.signup.edit.level_desc,
  }));
  const collector = channel.createMessageCollector({filter: (m)=>m.author.id != config.clientId, max: 1, time: 50000});
  collector.on('collect', async (msg, c) => {
    await sheetHelper.updateCellInSheet([5, msg.content], event, channel, player, playerIndex);
  });
}

/**
 * Called to select Gearscore
 * @param {DMChannel} channel
 * @param {string} event
 * @param {Array<string>} player
 * @param {Index} playerIndex
 */
async function editGearscore(channel, event, player, playerIndex) {
  // send "get name" message to user
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.gearscore_title,
    description: language.interactions.signup.edit.gearscore_desc,
  }));
  const collector = channel.createMessageCollector({filter: (m)=>m.author.id != config.clientId, max: 1, time: 50000});
  collector.on('collect', async (msg, c) => {
    await sheetHelper.updateCellInSheet([6, msg.content], event, channel, player, playerIndex);
  });
}


export default {
  init,
  editName,
  editWeapon1,
  editWeapon2,
  editRole,
  editLevel,
  editGearscore,
};
