import buttonActionHandler from '../misc/buttonActionHandler';
import {ButtonInteraction, MessageActionRow, MessageButton, Message, DMChannel} from 'discord.js';
import messageHandler from '../misc/messageHandler';
import googleSheetsHandler from '../misc/googleSheetsHandler';
import config from '../config';
import {dic, dic as language, replaceArgs} from '../misc/languageHandler';

const userRegistration = new Map();

/**
 * Standard Interaction class for default initialization of ButtonActions
 */
export default class Signup {
  constructor() {
    // called when Signup was clicked in the Signup post
    buttonActionHandler.addButtonAction(/signup-1/g, signup);
    // called when Sign out was clicked in the Singup post
    buttonActionHandler.addButtonAction(/signout-1/g, signout);
    // called when Confirm was clicked after signing up
    buttonActionHandler.addButtonAction(/signup-confirmation/g, signupConfirm);
    // called when Edit was clicked after signing up
    buttonActionHandler.addButtonAction(/signup-edit/g, signupEdit);
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

  // retrieve Players data from signup sheet
  const data = await googleSheetsHandler.retrieveData(config.googleSheetsId, 'Players!A2:G');
  // if data is empty, .values is missing and we initialize with empty array
  const players = data.values?data.values:[[]];
  // Finds Player Row by their user ID
  const playerData = players.find((subarray) => subarray[1] === userId);
  // If player already registered himself once
  if (playerData) {
    // retrieve signup sheet data
    const signupData = await googleSheetsHandler.retrieveData(config.googleSheetsId, 'Signup!A2:A');
    // if data is empty, .values is missing and we initialize with empty array
    const values = signupData.values?signupData.values:[[]];
    // flat the values array to 1 dimension (since only one column is needed)
    const signups = values.flat(1);
    // If user already signed up
    if (signups.indexOf(userId) >= 0) {
      // send already signed up message to suer
      channel.send(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        title: language.interactions.signup.already_signed_up_title,
        description: language.interactions.signup.already_signed_up_desc,
        color: 0xFF8888,
      }));
      // else sign up user
    } else {
      // create Confirm and Edit buttons
      const row = new MessageActionRow()
          .addComponents(
              new MessageButton()
                  .setCustomId('signup-confirmation')
                  .setLabel('Confirm')
                  .setStyle('SUCCESS'),
              new MessageButton()
                  .setCustomId('signup-edit')
                  .setLabel('Edit')
                  .setStyle('DANGER'),
          );

      // send Message containing all saved informations about their character
      channel.send(await messageHandler.getRichTextExplicitDefault({
        guild: interaction.guild,
        title: language.interactions.signup.confirmation.title,
        description: language.interactions.signup.confirmation.desc,
        categories: [{
          title: language.interactions.signup.confirmation.name,
          text: playerData[0],
          inline: true,
        },
        {
          title: language.interactions.signup.confirmation.weapon1,
          text: playerData[2],
          inline: true,
        },
        {
          title: language.interactions.signup.confirmation.weapon2,
          text: playerData[3],
          inline: true,
        },
        {
          title: language.interactions.signup.confirmation.role,
          text: playerData[4],
          inline: true,
        },
        {
          title: language.interactions.signup.confirmation.level,
          text: playerData[5],
          inline: true,
        },
        {
          title: language.interactions.signup.confirmation.gearscore,
          text: playerData[6],
          inline: true,
        }],
        buttons: row,
      }));
    }
    // else if player didn't register yet
  } else {
    // create Message Collector to retrieve ingame name with timeout of 10s
    const collector = channel.createMessageCollector((m)=>m.author.id !== config.clientId, {time: 10000});
    // on message received, call signupName and dispose collector
    collector.on('collect', (msg)=> {
      signupName(interaction, msg);
      collector.dispose();
    });
    // send "get name" message to user
    channel.send(await messageHandler.getRichTextExplicitDefault({
      guild: interaction.guild,
      title: language.interactions.edit.title,
      description: language.interactions.edit.desc,
    }));
  }
}

/**
 * Called to retri
 * @param {ButtonInteraction} interaction
 * @param {Message} msg
 */
async function signupName(interaction, msg) {
  // save name in temporary map to update google sheet later at once
  userRegistration.set(interaction.member.user.id, {name: msg.content});

  // TODO: add select interaction for Weapon 1
  // send message to select first Weapon
  msg.channel.send(await messageHandler.getRichTextExplicitDefault({
    title: language.interactions.edit.name_title,
    description: language.interactions.edit.name_desc,
  }));
}

/**
 * Called when Confirm Button was clicked after signing up
 * @param {ButtonInteraction} interaction
 */
async function signupConfirm(interaction) {
  // retrieve user id directly, because not clicked within a guild
  const userId = interaction.user.id;
  // retrieve channel from interaction
  const channel = interaction.channel;
  // get last message send from bot in this channel (the confirm button message)
  const filteredMessages = (await channel.messages.fetch()).filter((message) => message.author.id === config.clientId);
  // and delete it
  if (filteredMessages.size > 0) {
    filteredMessages.first().delete();
  }

  // append discord user id to the signup sheet
  await googleSheetsHandler.appendData(config.googleSheetsId, {range: 'Signup!A2:A', values: [[userId]]});

  // send confirmation message that signup was successfull || might need catch around google sheets api call
  channel.send(await messageHandler.getRichTextExplicitDefault({
    guild: interaction.guild,
    title: language.interactions.signup.confirmation.success.title,
    description: language.interactions.signup.confirmation.success.desc,
    color: 0x00cc00,
  }));
}


/**
 * Called when Edit Button was clicked
 * @param {ButtonInteraction} interaction
 */
async function signupEdit(interaction) {

}

/**
 * Called when Sign out button was clicked
 * @param {ButtonInteraction} interaction
 */
async function signout(interaction) {
  // retrieve user id from interaction member
  const userId = interaction.member.user.id;
  // create or retrieve Direct Message channel
  const channel = await interaction.member.createDM();
  // retrieve Players data from google sheets
  const data = await googleSheetsHandler.retrieveData(config.googleSheetsId, 'Players!A2:G');
  // if data is empty, .values is undefined and we create an empty array
  const players = data.values?data.values:[[]];
  // if data contains player with given user id
  if (players.find((subarray) => subarray[1] === userId)) {
    // retrieve signup data
    const signupData = await googleSheetsHandler.retrieveData(config.googleSheetsId, 'Signup!A2:A');
    // if data is empty, .values is undefined and we create an empty array
    const values = signupData.values?signupData.values:[[]];
    // flatten array to 1 dimension, since we only need 1 Column
    const signups = values.flat(1);
    // If user has signed up (user id is present)
    if (signups.indexOf(userId) >= 0) {
      // remove userid from local copy of google sheets // POTENTIAL RACE CONDITION
      signups.splice(signups.indexOf(userId), 1);
      const values = [];
      // the opposite of flat(1)
      for (const value of signups) {
        values.push([value]);
      }
      // update google sheets to set new values with missing userId || RACE CONDITION; POTENTIAL OVERWRITE
      await googleSheetsHandler.updateData(config.googleSheetsId, {range: 'Signup!A2:A', values: values});
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

