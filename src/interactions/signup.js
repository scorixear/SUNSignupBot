import buttonActionHandler from '../misc/buttonActionHandler';
import {ButtonInteraction, MessageActionRow, MessageButton, Message, DMChannel, MessageSelectMenu, SelectMenuInteraction, MessageCollector} from 'discord.js';
import messageHandler from '../misc/messageHandler';
import googleSheetsHandler from '../misc/googleSheetsHandler';
import config from '../config';
import {dic, dic as language, replaceArgs} from '../misc/languageHandler';
import sqlHandler from '../misc/sqlHandler';

const userRegistration = new Map();
const weaponOptions = [
  {
    label: 'Sword and Shield',
    value: 'Sword',
  },
  {
    label: 'Rapier',
    value: 'Rapier',
  },
  {
    label: 'Hatchet',
    value: 'Hatchet',
  },
  {
    label: 'Spear',
    value: 'Spear',
  },
  {
    label: 'Greataxe',
    value: 'Greataxe',
  },
  {
    label: 'Warhammer',
    value: 'Warhammer',
  },
  {
    label: 'Bow',
    value: 'Bow',
  },
  {
    label: 'Musket',
    value: 'Musket',
  },
  {
    label: 'Fire Staff',
    value: 'Fire Staff',
  },
  {
    label: 'Life Staff',
    value: 'Life Staff',
  },
  {
    label: 'Ice Gauntlet',
    value: 'Ice Gauntlet',
  },
];

const roleOptions = [{
  label: 'Tank',
  value: 'Tank',
},
{
  label: 'Melee',
  value: 'Melee',
},
{
  label: 'Range',
  value: 'Range',
},
{
  label: 'Healer',
  value: 'Healer',
}];
/**
 * Standard Interaction class for default initialization of ButtonActions
 */
export default class Signup {
  constructor() {
    // called when Signup was clicked in the Signup post
    buttonActionHandler.addButtonAction('signup-1', signup);
    // called when Sign out was clicked in the Singup post
    buttonActionHandler.addButtonAction('signout-1', signout);
    // called when Confirm was clicked after signing up
    buttonActionHandler.addButtonAction('signup-confirmation', signupConfirm);
    // called when Edit was clicked after signing up
    buttonActionHandler.addButtonAction('signup-edit', signupEdit);
    buttonActionHandler.addButtonAction('signup-weapon1', signupWeapon1);
    buttonActionHandler.addButtonAction('signup-weapon2', signupWeapon2);
    buttonActionHandler.addButtonAction('signup-role', signupRole);
    buttonActionHandler.addButtonAction('signup-update-weapon1', signupWeapon1Update);
    buttonActionHandler.addButtonAction('signup-update-weapon2', signupWeapon2Update);
    buttonActionHandler.addButtonAction('signup-update-role', signupRoleUpdate);
    buttonActionHandler.addButtonAction('edit-weapon1', editWeapon1Event);
    buttonActionHandler.addButtonAction('edit-weapon2', editWeapon2Event);
    buttonActionHandler.addButtonAction('edit-role', editRoleEvent);
  }
}

/**
   * Handles Button Click on Sign up
   * @param {ButtonInteraction} interaction
   */
async function signup(interaction) {
  // Retrieve user id from interaction
  const userId = interaction.member.user.id;
  // create or retrieve Discord direct Message Channel between user and bot
  /** @type{DMChannel} */
  const channel = await interaction.member.createDM();
  const event = interaction.customId.slice(8);

  // retrieve Players data from signup sheet
  const data = await googleSheetsHandler.retrieveData(config.googleSheetsId, 'Players!A2:Z');
  // if data is empty, .values is missing and we initialize with empty array
  const players = data.values?data.values:[[]];
  // Finds Player Row by their user ID
  const player = players.find((subarray)=>subarray[1] === userId);
  // If player already registered himself once
  if (player) {
    if (await sqlHandler.isSignedIn(event, userId)) {
      // send already signed up message to suer
      channel.send(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        title: language.interactions.signup.already_signed_up_title,
        description: language.interactions.signup.already_signed_up_desc,
        color: 0xFF8888,
      }));
      // else sign up user
    } else {
      sendConfirmationMessage(event, channel, player);
    }
    // else if player didn't register yet
  } else {
    // send "get name" message to user
    channel.send(await messageHandler.getRichTextExplicitDefault({
      guild: interaction.guild,
      title: language.interactions.signup.edit.name_title,
      description: language.interactions.signup.edit.name_desc,
    }));
    const collector = channel.createMessageCollector({filter: (m)=>m.author.id != config.clientId, max: 1, time: 50000});
    collector.on('collect', (msg, c) => {
      signupName(interaction, event, msg, false);
    });
  }
}

/**
 * Called when Ingame name was entered
 * @param {ButtonInteraction} interaction
 * @param {string} event
 * @param {Message} msg
 * @param {bool} update
 */
async function signupName(interaction, event, msg, update) {
  // save name in temporary map to update google sheet later at once
  userRegistration.set(interaction.user.id, {name: msg.content});

  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId('signup-'+(update?'update-':'')+'weapon1'+event)
              .setPlaceholder('Nothing selected')
              .addOptions(weaponOptions),
      );
  // send message to select first Weapon
  msg.channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.weapon1_title,
    description: language.interactions.signup.edit.weapon1_desc,
    buttons: row,
  }));
}

/**
 *
 * @param {SelectMenuInteraction} interaction
 */
async function signupWeapon1(interaction) {
  userRegistration.get(interaction.user.id).weapon1 = interaction.values[0];
  const event = interaction.customId.slice(14);

  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId('signup-weapon2'+event)
              .setPlaceholder('Nothing selected')
              .addOptions(weaponOptions),
      );
  // send message to select first Weapon
  interaction.channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.weapon2_title,
    description: language.interactions.signup.edit.weapon2_desc,
    buttons: row,
  }));
}

/**
 *
 * @param {SelectMenuInteraction} interaction
 */
async function signupWeapon1Update(interaction) {
  userRegistration.get(interaction.user.id).weapon1 = interaction.values[0];
  const event = interaction.customId.slice(21);

  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId('signup-update-weapon2'+event)
              .setPlaceholder('Nothing selected')
              .addOptions(weaponOptions),
      );
  // send message to select first Weapon
  interaction.channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.weapon2_title,
    description: language.interactions.signup.edit.weapon2_desc,
    buttons: row,
  }));
}

/**
 *
 * @param {SelectMenuInteraction} interaction
 */
async function signupWeapon2(interaction) {
  userRegistration.get(interaction.user.id).weapon2 = interaction.values[0];
  const event = interaction.customId.slice(14);

  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId('signup-role'+event)
              .setPlaceholder('Nothing selected')
              .addOptions(roleOptions),
      );
  // send message to select first Weapon
  interaction.channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.role_title,
    description: language.interactions.signup.edit.role_desc,
    buttons: row,
  }));
}

/**
 *
 * @param {SelectMenuInteraction} interaction
 */
async function signupWeapon2Update(interaction) {
  userRegistration.get(interaction.user.id).weapon2 = interaction.values[0];
  const event = interaction.customId.slice(21);

  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId('signup-update-role'+event)
              .setPlaceholder('Nothing selected')
              .addOptions(roleOptions),
      );
  // send message to select first Weapon
  interaction.channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.role_title,
    description: language.interactions.signup.edit.role_desc,
    buttons: row,
  }));
}

/**
 *
 * @param {SelectMenuInteraction} interaction
 */
async function signupRole(interaction) {
  userRegistration.get(interaction.user.id).role = interaction.values[0];
  const event = interaction.customId.slice(11);
  const channel = interaction.channel;

  // send "get name" message to user
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.level_title,
    description: language.interactions.signup.edit.level_desc,
  }));
  const collector = channel.createMessageCollector({filter: (m)=>m.author.id != config.clientId, max: 1, time: 50000});
  collector.on('collect', (msg, c) => {
    signupLevel(interaction, event, msg);
  });
}

/**
 *
 * @param {SelectMenuInteraction} interaction
 */
async function signupRoleUpdate(interaction) {
  userRegistration.get(interaction.user.id).role = interaction.values[0];
  const event = interaction.customId.slice(18);
  const channel = interaction.channel;

  // send "get name" message to user
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.level_title,
    description: language.interactions.signup.edit.level_desc,
  }));
  const collector = channel.createMessageCollector({filter: (m)=>m.author.id != config.clientId, max: 1, time: 50000});
  collector.on('collect', (msg, c) => {
    signupLevel(interaction, event, msg, true);
  });
}

async function signupLevel(interaction, event, msg, update) {
  userRegistration.get(interaction.user.id).level = msg.content;
  const channel = interaction.channel;

  // send "get name" message to user
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.gearscore_title,
    description: language.interactions.signup.edit.gearscore_desc,
  }));
  const collector = channel.createMessageCollector({filter: (m)=>m.author.id != config.clientId, max: 1, time: 50000});
  collector.on('collect', (msg, c) => {
    signupGearscore(interaction, event, msg, update);
  });
}

async function signupGearscore(interaction, event, msg, update) {
  const userData = userRegistration.get(interaction.user.id);
  userData.gearscore = msg.content;
  const channel = interaction.channel;


  if (update) {
    const playerData = await googleSheetsHandler.retrieveData(config.googleSheetsId, 'Players!A2:Z');
    const players = playerData.values?playerData.values:[[]];
    let playerIndex;
    let i = 0;
    for (const p of players) {
      if (p[1]===interaction.user.id) {
        playerIndex = i;
        break;
      }
      i++;
    }
    await updateSheetTotal([userData.name, interaction.user.id, userData.weapon1, userData.weapon2, userData.role, userData.level, userData.gearscore], playerIndex);
  } else {
    await googleSheetsHandler.appendData(config.googleSheetsId, {range: 'Players!A2:Z', values: [[
      userData.name,
      interaction.user.id,
      userData.weapon1,
      userData.weapon2,
      userData.role,
      userData.level,
      userData.gearscore]]});
  }

  userRegistration.delete(interaction.user.id);


  sendConfirmationMessage(event, channel, [userData.name, interaction.user.id, userData.weapon1, userData.weapon2, userData.role, userData.level, userData.gearscore]);
}

/**
 * Called when Confirm Button was clicked after signing up
 * @param {ButtonInteraction} interaction
 */
async function signupConfirm(interaction) {
  // retrieve user id directly, because not clicked within a guild
  const userId = interaction.user.id;
  const event = interaction.customId.slice(19);
  // retrieve channel from interaction
  const channel = interaction.channel;
  // get last message send from bot in this channel (the confirm button message)
  const filteredMessages = (await channel.messages.fetch()).filter((message) => message.author.id === config.clientId);
  // and delete it
  if (filteredMessages.size > 0) {
    filteredMessages.first().delete();
  }

  const playerData = await googleSheetsHandler.retrieveData(config.googleSheetsId, 'Players!A2:Z');
  // if data is empty, .values is missing and we initialize with empty array
  const players = playerData.values?playerData.values:[[]];
  // Finds Player Row by their user ID
  const player = players.find((subarray)=>subarray[1] === userId);
  // If player already registered himself once
  if (player) {
  // update database
    await sqlHandler.signIn(event, userId);
    // send confirmation message that signup was successfull || might need catch around google sheets api call
    channel.send(await messageHandler.getRichTextExplicitDefault({
      guild: interaction.guild,
      title: language.interactions.signup.confirmation.success.title,
      description: language.interactions.signup.confirmation.success.desc,
      color: 0x00cc00,
    }));
  }
}


/**
 * Called when Edit Button was clicked
 * @param {ButtonInteraction} interaction
 */
async function signupEdit(interaction) {
  const channel = interaction.channel;
  const event = interaction.customId.slice(11);

  const playerData = await googleSheetsHandler.retrieveData(config.googleSheetsId, 'Players!A2:Z');
  const players = playerData.values?playerData.values:[[]];
  let player;
  let playerIndex;
  let i = 0;
  for (const p of players) {
    if (p[1]===interaction.user.id) {
      player = p;
      playerIndex = i;
      break;
    }
    i++;
  }
  const msg = await channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit_title,
    description: language.interactions.signup.edit_description,
    categories: [
      {
        title: language.interactions.signup.confirmation.name,
        text: '1️⃣ '+player[0],
        inline: true,
      },
      {
        title: language.interactions.signup.confirmation.weapon1,
        text: '2️⃣ '+player[2],
        inline: true,
      },
      {
        title: language.interactions.signup.confirmation.weapon2,
        text: '3️⃣ '+player[3],
        inline: true,
      },
      {
        title: language.interactions.signup.confirmation.role,
        text: '4️⃣ '+player[4],
        inline: true,
      },
      {
        title: language.interactions.signup.confirmation.level,
        text: '5️⃣ '+player[5],
        inline: true,
      },
      {
        title: language.interactions.signup.confirmation.gearscore,
        text: '6️⃣ '+player[6],
        inline: true,
      },
      {
        title: language.interactions.signup.edit.everything_title,
        text: '7️⃣ '+language.interactions.signup.edit.everything_desc,
        inline: true,
      },
    ],
  }));


  msg.awaitReactions({filter: (react, user)=>user.id !== config.clientId, max: 1, time: 60000})
      .then(async (collected) => {
        // console.log(collected);
        switch (collected.firstKey()) {
          case '1️⃣':
            await editName(interaction, event, player, playerIndex);
            break;
          case '2️⃣':
            await editWeapon1(interaction, event);
            break;
          case '3️⃣':
            await editWeapon2(interaction, event);
            break;
          case '4️⃣':
            await editRole(interaction, event);
            break;
          case '5️⃣':
            await editLevel(interaction, event, player, playerIndex);
            break;
          case '6️⃣':
            await editGearscore(interaction, event, player, playerIndex);
            break;
          case '7️⃣':
            channel.send(await messageHandler.getRichTextExplicitDefault({
              guild: interaction.guild,
              title: language.interactions.signup.edit.name_title,
              description: language.interactions.signup.edit.name_desc,
            }));
            const collector = channel.createMessageCollector({filter: (m)=>m.author.id != config.clientId, max: 1, time: 50000});
            collector.on('collect', (msg, c) => {
              signupName(interaction, event, msg, true);
            });
            break;
        }
      });

  await msg.react('1️⃣');
  await msg.react('2️⃣');
  await msg.react('3️⃣');
  await msg.react('4️⃣');
  await msg.react('5️⃣');
  await msg.react('6️⃣');
  await msg.react('7️⃣');
}

async function sendConfirmationMessage(event, channel, player) {
  const row = new MessageActionRow()
      .addComponents(
          new MessageButton()
              .setCustomId('signup-confirmation'+event)
              .setLabel('Confirm')
              .setStyle('SUCCESS'),
          new MessageButton()
              .setCustomId('signup-edit'+event)
              .setLabel('Edit')
              .setStyle('DANGER'),
      );
  await channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.confirmation.title,
    description: language.interactions.signup.confirmation.desc,
    categories: [
      {
        title: language.interactions.signup.confirmation.name,
        text: player[0],
        inline: true,
      },
      {
        title: language.interactions.signup.confirmation.weapon1,
        text: player[2],
        inline: true,
      },
      {
        title: language.interactions.signup.confirmation.weapon2,
        text: player[3],
        inline: true,
      },
      {
        title: language.interactions.signup.confirmation.role,
        text: player[4],
        inline: true,
      },
      {
        title: language.interactions.signup.confirmation.level,
        text: player[5],
        inline: true,
      },
      {
        title: language.interactions.signup.confirmation.gearscore,
        text: player[6],
        inline: true,
      },
    ],
    buttons: row,
  }));
}

async function editName(interaction, event, player, playerIndex) {
  const channel = interaction.channel;
  // send "get name" message to user
  channel.send(await messageHandler.getRichTextExplicitDefault({
    guild: interaction.guild,
    title: language.interactions.signup.edit.name_title,
    description: language.interactions.signup.edit.name_desc,
  }));
  const collector = channel.createMessageCollector({filter: (m)=>m.author.id != config.clientId, max: 1, time: 50000});
  collector.on('collect', (msg, c) => {
    updateSheet([0, msg.content], event, channel, player, playerIndex);
  });
}

async function editWeapon1(interaction, event) {
  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId('edit-weapon1'+event)
              .setPlaceholder('Nothing selected')
              .addOptions(weaponOptions),
      );
  // send message to select first Weapon
  interaction.channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.weapon1_title,
    description: language.interactions.signup.edit.weapon1_desc,
    buttons: row,
  }));
}

async function editWeapon1Event(interaction) {
  const value = interaction.values[0];

  const playerData = await googleSheetsHandler.retrieveData(config.googleSheetsId, 'Players!A2:Z');
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
  updateSheet([2, value], interaction.customId.slice(12), interaction.channel, player, playerIndex);
}

async function editWeapon2(interaction, event) {
  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId('edit-weapon2'+event)
              .setPlaceholder('Nothing selected')
              .addOptions(weaponOptions),
      );
  // send message to select first Weapon
  interaction.channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.weapon2_title,
    description: language.interactions.signup.edit.weapon2_desc,
    buttons: row,
  }));
}

async function editWeapon2Event(interaction) {
  const value = interaction.values[0];

  const playerData = await googleSheetsHandler.retrieveData(config.googleSheetsId, 'Players!A2:Z');
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
  await updateSheet([3, value], interaction.customId.slice(12), interaction.channel, player, playerIndex);
}

async function editRole(interaction, event) {
  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId('edit-role'+event)
              .setPlaceholder('Nothing selected')
              .addOptions(roleOptions),
      );
  // send message to select first Weapon
  interaction.channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.role_title,
    description: language.interactions.signup.edit.role_desc,
    buttons: row,
  }));
}

async function editRoleEvent(interaction) {
  const value = interaction.values[0];

  const playerData = await googleSheetsHandler.retrieveData(config.googleSheetsId, 'Players!A2:Z');
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
  await updateSheet([4, value], interaction.customId.slice(9), interaction.channel, player, playerIndex);
}

async function editLevel(interaction, event, player, playerIndex, sendConfirmation) {
  const channel = interaction.channel;
  // send "get name" message to user
  channel.send(await messageHandler.getRichTextExplicitDefault({
    guild: interaction.guild,
    title: language.interactions.signup.edit.level_title,
    description: language.interactions.signup.edit.level_desc,
  }));
  const collector = channel.createMessageCollector({filter: (m)=>m.author.id != config.clientId, max: 1, time: 50000});
  collector.on('collect', (msg, c) => {
    updateSheet([5, msg.content], event, channel, player, playerIndex, sendConfirmation);
  });
}

async function editGearscore(interaction, event, player, playerIndex) {
  const channel = interaction.channel;
  // send "get name" message to user
  channel.send(await messageHandler.getRichTextExplicitDefault({
    guild: interaction.guild,
    title: language.interactions.signup.edit.gearscore_title,
    description: language.interactions.signup.edit.gearscore_desc,
  }));
  const collector = channel.createMessageCollector({filter: (m)=>m.author.id != config.clientId, max: 1, time: 50000});
  collector.on('collect', (msg, c) => {
    updateSheet([6, msg.content], event, channel, player, playerIndex);
  });
}

async function updateSheet(data, event, channel, player, index) {
  player[data[0]]=data[1];
  await updateSheetTotal(player, index);
  sendConfirmationMessage(event, channel, player);
}

async function updateSheetTotal(data, index) {
  await googleSheetsHandler.updateData(config.googleSheetsId, {range: `Players!A${index+2}:Z${index+2}`, values: [data]});
}

/**
 * Called when Sign out button was clicked
 * @param {ButtonInteraction} interaction
 */
async function signout(interaction) {
  // retrieve user id from interaction member
  const userId = interaction.member.user.id;
  const event = interaction.customId.slice(9);
  // create or retrieve Direct Message channel
  const channel = await interaction.member.createDM();
  // retrieve Players data from google sheets
  const data = await googleSheetsHandler.retrieveData(config.googleSheetsId, 'Players!A2:Z');
  // if data is empty, .values is undefined and we create an empty array
  const players = data.values?data.values:[[]];

  // Finds Player Row by their user ID
  const player = players.find((subarray)=>subarray[1] === userId);
  // If player already registered himself once
  if (player) {
    if (await sqlHandler.isSignedIn(event, userId)) {
      if (!await sqlHandler.signOut(event, userId)) {
        // Send confirmation message to channel that user was signed out
        channel.send(await messageHandler.getRichTextExplicitDefault( {
          guild: interaction.guild,
          title: dic.interactions.signout.error_title,
          description: dic.interactions.signout.error_desc,
          color: 0x00cc00,
        }));
        return;
      }
    }
  }

  // Send confirmation message to channel that user was signed out
  channel.send(await messageHandler.getRichTextExplicitDefault( {
    guild: interaction.guild,
    title: dic.interactions.signout.confirmation_title,
    description: dic.interactions.signout.confirmation_desc,
    color: 0x00cc00,
  }));
}
