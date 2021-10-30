import buttonActionHandler from '../misc/buttonActionHandler';
import {ButtonInteraction, MessageActionRow, MessageButton, Message, DMChannel, MessageSelectMenu, SelectMenuInteraction, MessageCollector} from 'discord.js';
import messageHandler from '../misc/messageHandler';
import googleSheetsHandler from '../misc/googleSheetsHandler';
import config from '../config';
import {dic, dic as language, replaceArgs} from '../misc/languageHandler';
import sqlHandler from '../misc/sqlHandler';
import {updateSignupMessage, updateUnavailable} from '../commands/Moderation/signup';
import {weaponOptions, roleOptions, guildOptions} from './signupConfig';
import editHandler from './editHandler';
import sheetHelper from './sheetHelper';
import interactionsHelper from './interactionsHelper';

/**
 * Local Storage for ongoing Signups
 */
const userRegistration = new Map();

const userSignup = new Set();

function signupRunning(userId) {
  return userSignup.has(userId);
}

function signupStarted(userId) {
  userSignup.add(userId);
}

function signupFinished(userId) {
  userSignup.delete(userId);
}
/**
 * Standard Interaction class for default initialization of ButtonActions
 */
class Signup {
  constructor() {
    // called when Signup was clicked in the Signup post
    buttonActionHandler.addButtonAction('signup-1', signup);
    // called when Sign out was clicked in the Singup post
    buttonActionHandler.addButtonAction('signout-1', signout);
    // called when Confirm was clicked after signing up
    buttonActionHandler.addButtonAction('signup-confirmation', signupConfirm);
    // called when Edit was clicked after signing up
    buttonActionHandler.addButtonAction('signup-edit', signupEdit);
    // called after selecting weapon 1
    buttonActionHandler.addButtonAction('signup-weapon1', signupWeapon1);
    // called after selecting weapon 2
    buttonActionHandler.addButtonAction('signup-weapon2', signupWeapon2);
    // called after selecting role
    buttonActionHandler.addButtonAction('signup-role', signupRole);
    // called after selecting weapon 1 from the edit option
    buttonActionHandler.addButtonAction('signup-update-weapon1', signupWeapon1Update);
    // called after selecting weapon 2 from edit option
    buttonActionHandler.addButtonAction('signup-update-weapon2', signupWeapon2Update);
    // called after selecting role from edit option
    buttonActionHandler.addButtonAction('signup-update-role', signupRoleUpdate);
    // called after selecting role from edit option
    buttonActionHandler.addButtonAction('signup-guild', signupGuild);
    // called after selecting role from edit option
    buttonActionHandler.addButtonAction('signup-update-guild', signupGuildUpdate);

    buttonActionHandler.addButtonAction('unavailable', unavailable);

    editHandler.init();
  }
}

/**
 * Called when Unavailable is clicked
 * @param {ButtonInteraction} interaction
 */
async function unavailable(interaction) {
  const userId = interaction.member.user.id;
  const event = interaction.customId.slice('unavailable'.length);
  if (await sqlHandler.isUnavailable(event, userId)) {
    await sqlHandler.removeUnavailable(event, userId);
    updateUnavailable(event, false);
  } else {
    if (signupRunning(userId)) {
      return;
    }
    if (await sqlHandler.isSignedIn(event, userId)) {
      if (!await sqlHandler.signOut(event, userId)) {
        return;
      }
      await updateSignupMessage(event);
      await sqlHandler.setUnavailable(event, userId);
      await updateUnavailable(event, true);
    }

    console.log('User signed out', userId, event);
  }
}

/**
   * Handles Button Click on Sign up
   * @param {ButtonInteraction} interaction
   */
async function signup(interaction) {
  // Retrieve user id from interaction
  const userId = interaction.member.user.id;
  if (signupRunning(userId)) {
    return;
  }
  // create or retrieve Discord direct Message Channel between user and bot
  /** @type{DMChannel} */
  const channel = await interaction.member.createDM();
  const event = interaction.customId.slice('signup-1'.length);
  console.log('Signup request received', userId, event);
  const player = await sheetHelper.getRowFromSheet(userId);
  // If player already registered himself once
  if (player) {
    // check if sql database has him signed up
    if (await sqlHandler.isSignedIn(event, userId)) {
      // send already signed up message to user
      channel.send(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        title: language.interactions.signup.already_signed_up_title,
        description: language.interactions.signup.already_signed_up_desc,
        color: 0xFF8888,
      }));
      // else sign up user
    } else {
      signupStarted(userId);
      await sheetHelper.sendConfirmationMessage(event, channel, player);
    }
    // else if player didn't register yet
  } else {
    signupStarted(userId);
    // send "get name" message to user
    const message = await channel.send(await messageHandler.getRichTextExplicitDefault({
      guild: interaction.guild,
      title: language.interactions.signup.edit.name_title,
      description: language.interactions.signup.edit.name_desc,
    }));

    interactionsHelper.createMessageCollector(
        channel,
        message,
        language.interactions.signup.error.name_timeout_desc,
        (msg)=> {
          signupName(userId, event, msg, false);
        },
        userId,
    );
  }
}

/**
 * Called when Ingame name was entered
 * @param {number} userId
 * @param {string} event
 * @param {Message} msg
 * @param {bool} update
 */
async function signupName(userId, event, msg, update) {
  // save name in temporary map to update google sheet later at once
  userRegistration.set(userId, {name: msg.content});

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
 * Called when Weapon 1 was selected (new entry)
 * @param {SelectMenuInteraction} interaction
 */
async function signupWeapon1(interaction) {
  userRegistration.get(interaction.user.id).weapon1 = interaction.values[0];
  const event = interaction.customId.slice('signup-weapon1'.length);
  interaction.message.delete();
  // interactionsHelper.deleteLastMessage(interaction.channel);

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
 * Called when weapon 1 was selected (update Entry)
 * @param {SelectMenuInteraction} interaction
 */
async function signupWeapon1Update(interaction) {
  userRegistration.get(interaction.user.id).weapon1 = interaction.values[0];
  const event = interaction.customId.slice('signup-update-weapon1'.length);
  interaction.message.delete();
  // interactionsHelper.deleteLastMessage(interaction.channel);

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
 * Called when weapon 2 was selected (new entry)
 * @param {SelectMenuInteraction} interaction
 */
async function signupWeapon2(interaction) {
  userRegistration.get(interaction.user.id).weapon2 = interaction.values[0];
  const event = interaction.customId.slice('signup-weapon2'.length);
  interaction.message.delete();
  // interactionsHelper.deleteLastMessage(interaction.channel);

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
 * Called when weapon 2 was selected (update entry)
 * @param {SelectMenuInteraction} interaction
 */
async function signupWeapon2Update(interaction) {
  userRegistration.get(interaction.user.id).weapon2 = interaction.values[0];
  const event = interaction.customId.slice('signup-update-weapon2'.length);
  interaction.message.delete();
  // interactionsHelper.deleteLastMessage(interaction.channel);

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
 * Called when Role was selected (new entry)
 * @param {SelectMenuInteraction} interaction
 */
async function signupRole(interaction) {
  userRegistration.get(interaction.user.id).role = interaction.values[0];
  const event = interaction.customId.slice('signup-role'.length);
  const channel = interaction.channel;
  interaction.message.delete();
  // interactionsHelper.deleteLastMessage(channel);

  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId('signup-guild'+event)
              .setPlaceholder('Nothing selected')
              .addOptions(guildOptions),
      );
  // send message to select first Weapon
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.guild_title,
    description: language.interactions.signup.edit.guild_desc,
    buttons: row,
  }));
}

/**
 * Called when Role was selected (update entry)
 * @param {SelectMenuInteraction} interaction
 */
async function signupRoleUpdate(interaction) {
  userRegistration.get(interaction.user.id).role = interaction.values[0];
  const event = interaction.customId.slice('signup-update-role'.length);
  const channel = interaction.channel;
  interaction.message.delete();
  // interactionsHelper.deleteLastMessage(channel);

  const row = new MessageActionRow()
      .addComponents(
          new MessageSelectMenu()
              .setCustomId('signup-update-guild'+event)
              .setPlaceholder('Nothing selected')
              .addOptions(guildOptions),
      );
  // send message to select first Weapon
  channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.guild_title,
    description: language.interactions.signup.edit.guild_desc,
    buttons: row,
  }));
}

/**
 * Called when Guild was selected (new entry)
 * @param {SelectMenuInteraction} interaction
 */
async function signupGuild(interaction) {
  userRegistration.get(interaction.user.id).guild = interaction.values[0];
  const event = interaction.customId.slice('signup-guild'.length);
  const channel = interaction.channel;
  interaction.message.delete();
  // interactionsHelper.deleteLastMessage(channel);

  // send "get name" message to user
  const message = await channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.level_title,
    description: language.interactions.signup.edit.level_desc,
  }));
  interactionsHelper.createMessageCollector(
      channel,
      message,
      language.interactions.signup.error.level_timeout_desc,
      async (msg)=> {
        await signupLevel(interaction.user.id, interaction.channel, event, msg, false);
      },
      interaction.user.id,
  );
}

/**
 * Called when Guild was selected (update entry)
 * @param {SelectMenuInteraction} interaction
 */
async function signupGuildUpdate(interaction) {
  userRegistration.get(interaction.user.id).guild = interaction.values[0];
  const event = interaction.customId.slice('signup-update-guild'.length);
  const channel = interaction.channel;
  interaction.message.delete();
  // interactionsHelper.deleteLastMessage(channel);

  // send "get name" message to user
  const message = await channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.level_title,
    description: language.interactions.signup.edit.level_desc,
  }));
  interactionsHelper.createMessageCollector(
      channel,
      message,
      language.interactions.signup.error.level_timeout_desc,
      async (msg)=> {
        await signupLevel(interaction.user.id, interaction.channel, event, msg, true);
      },
      interaction.user.id,
  );
}

/**
 * Called when Level was collected
 * @param {string} userId
 * @param {DMChannel} channel
 * @param {string} event
 * @param {Message} msg
 * @param {Boolean} isUpdate
 */
async function signupLevel(userId, channel, event, msg, isUpdate) {
  userRegistration.get(userId).level = msg.content;

  // send "get name" message to user
  const message = await channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.signup.edit.gearscore_title,
    description: language.interactions.signup.edit.gearscore_desc,
  }));

  interactionsHelper.createMessageCollector(
      channel,
      message,
      language.interactions.signup.error.gearscore_timeout_desc,
      async (msg)=> {
        await signupGearscore(userId, channel, event, msg, isUpdate);
      },
      userId,
  );
}

/**
 * Called when Gearscore was collected
 * @param {*} userId
 * @param {DMChannel} channel
 * @param {*} event
 * @param {*} msg
 * @param {*} isUpdate
 */
async function signupGearscore(userId, channel, event, msg, isUpdate) {
  // retrieve local stored user data
  const userData = userRegistration.get(userId);
  userData.gearscore = msg.content;

  // if call is to update sheet
  if (isUpdate) {
    // retrieve row index in sheet
    const playerIndex = await sheetHelper.getIndexFromSheet(userId);
    await sheetHelper.updateRowInSheet([userData.name, userId, userData.weapon1, userData.weapon2, userData.role, userData.guild, userData.level, userData.gearscore], playerIndex);
    console.log('Google Sheet User Updated', userId, event);
  } else {
    // append new Row to sheet
    await googleSheetsHandler.appendData(config.googleSheetsId, {range: config.googleSheetsRange, values: [[
      userData.name,
      userId,
      userData.weapon1,
      userData.weapon2,
      userData.role,
      userData.guild,
      userData.level,
      userData.gearscore]]});
    console.log('Google Sheet User Registered', userId, event);
  }

  // delete local stored user data
  userRegistration.delete(userId);

  // send confirmation message about changed / registered information
  await sheetHelper.sendConfirmationMessage(event, channel, [userData.name, userId, userData.weapon1, userData.weapon2, userData.role, userData.guild, userData.level, userData.gearscore]);
}

/**
 * Called when Confirm Button was clicked after signing up
 * @param {ButtonInteraction} interaction
 */
async function signupConfirm(interaction) {
  // retrieve user id directly, because not clicked within a guild
  const userId = interaction.user.id;
  const event = interaction.customId.slice('signup-confirmation'.length);
  // retrieve channel from interaction
  const channel = interaction.channel;

  interaction.message.delete();
  // interactionsHelper.deleteLastMessage(channel);

  const player = await sheetHelper.getRowFromSheet(userId);
  // If player already registered himself once
  if (player) {
  // update database
    const success = await sqlHandler.signIn(event, userId);
    if (success) {
      await updateSignupMessage(event);
      if (await sqlHandler.isUnavailable(event, userId)) {
        await sqlHandler.removeUnavailable(event, userId);
        await updateUnavailable(event, false);
      }
      // send confirmation message that signup was successfull || might need catch around google sheets api call
      channel.send(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        title: language.interactions.signup.confirmation.success.title,
        description: language.interactions.signup.confirmation.success.desc,
        color: 0x00cc00,
      }));
      console.log('User signed up', userId, event);
    }
    signupFinished(userId);
  }
}


/**
 * Called when Edit Button was clicked
 * @param {ButtonInteraction} interaction
 */
async function signupEdit(interaction) {
  const channel = interaction.channel;
  const event = interaction.customId.slice('signup-edit'.length);
  interaction.message.delete();
  // interactionsHelper.deleteLastMessage(channel);

  const [playerIndex, player] = await sheetHelper.getIndexAndRowFromSheet(interaction.user.id);

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
        title: language.interactions.signup.confirmation.guild,
        text: '5️⃣ '+player[5],
        inline: true,
      },
      {
        title: language.interactions.signup.confirmation.level,
        text: '6️⃣ '+player[6],
        inline: true,
      },
      {
        title: language.interactions.signup.confirmation.gearscore,
        text: '7️⃣ '+player[7],
        inline: true,
      },
      {
        title: language.interactions.signup.edit.everything_title,
        text: '8️⃣ '+language.interactions.signup.edit.everything_desc,
        inline: true,
      },
    ],
  }));


  msg.awaitReactions({filter: (react, user)=>user.id !== config.clientId, max: 1, time: 60000})
      .then(async (collected) => {
        msg.delete();
        if (collected.size == 0) {
          signupFinished(interaction.user.id);
          await channel.send(await messageHandler.getRichTextExplicitDefault({
            title: language.interactions.signup.error.timeout_title,
            description: language.interactions.signup.error.reactTime_desc,
            color: 0xcc0000,
          }));
          return;
        }

        // console.log(collected);
        switch (collected.firstKey()) {
          case '1️⃣':
            await editHandler.editName(channel, event, player, playerIndex, interaction.user.id);
            break;
          case '2️⃣':
            await editHandler.editWeapon1(channel, event);
            break;
          case '3️⃣':
            await editHandler.editWeapon2(channel, event);
            break;
          case '4️⃣':
            await editHandler.editRole(channel, event);
            break;
          case '5️⃣':
            await editHandler.editGuild(channel, event);
            break;
          case '6️⃣':
            await editHandler.editLevel(channel, event, player, playerIndex, interaction.user.id);
            break;
          case '7️⃣':
            await editHandler.editGearscore(channel, event, player, playerIndex, interaction.user.id);
            break;
          case '8️⃣':
            const message = await channel.send(await messageHandler.getRichTextExplicitDefault({
              title: language.interactions.signup.edit.name_title,
              description: language.interactions.signup.edit.name_desc,
            }));

            interactionsHelper.createMessageCollector(
                channel,
                message,
                language.interactions.signup.error.name_timeout_desc,
                async (msg)=> {
                  await signupName(interaction.user.id, event, msg, true);
                },
                interaction.user.id,
            );
            break;
        }
      });
  try {
    await msg.react('1️⃣');
    await msg.react('2️⃣');
    await msg.react('3️⃣');
    await msg.react('4️⃣');
    await msg.react('5️⃣');
    await msg.react('6️⃣');
    await msg.react('7️⃣');
    await msg.react('8️⃣');
  } catch (err) {}
}

/**
 * Called when Sign out button was clicked
 * @param {ButtonInteraction} interaction
 */
async function signout(interaction) {
  // retrieve user id from interaction member
  const userId = interaction.member.user.id;
  if (signupRunning(userId)) {
    return;
  }
  const event = interaction.customId.slice('signout-1'.length);
  console.log('User signout received', userId, event);
  // create or retrieve Direct Message channel
  const channel = await interaction.member.createDM();
  // retrieve Players data from google sheets

  if (await sqlHandler.isSignedIn(event, userId)) {
    if (!await sqlHandler.signOut(event, userId)) {
      // Send confirmation message to channel that user was signed out
      channel.send(await messageHandler.getRichTextExplicitDefault( {
        title: dic.interactions.signout.error_title,
        description: dic.interactions.signout.error_desc,
        color: 0x00cc00,
      }));
      return;
    }
    await updateSignupMessage(event);
    if (!(await sqlHandler.isUnavailable(event, userId))) {
      await sqlHandler.setUnavailable(event, userId);
      await updateUnavailable(event, true);
    }
  }


  // Send confirmation message to channel that user was signed out
  channel.send(await messageHandler.getRichTextExplicitDefault( {
    guild: interaction.guild,
    title: dic.interactions.signout.confirmation_title,
    description: dic.interactions.signout.confirmation_desc,
    color: 0x00cc00,
  }));
  console.log('User signed out', userId, event);
}

export default {
  Signup,
  signupRunning,
  signupStarted,
  signupFinished,
};
