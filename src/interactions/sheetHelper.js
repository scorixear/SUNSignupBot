import config from '../config';
import googleSheetsHandler from '../misc/googleSheetsHandler';
import {MessageActionRow, MessageButton} from 'discord.js';
import messageHandler from '../misc/messageHandler';
import {dic as language} from '../misc/languageHandler';

/**
 * Retrieves the Row from a google sheet
 * @param {string} userId
 * @return {Array<string>}
 */
async function getRowFromSheet(userId) {
  // retrieve Players data from signup sheet
  const data = await googleSheetsHandler.retrieveData(config.googleSheetsId, config.googleSheetsRange);
  // if data is empty, .values is missing and we initialize with empty array
  const fullSheetArray = data.values?data.values:[[]];
  // Finds Player Row by their user ID
  const player = fullSheetArray.find((subarray)=>subarray[1] === userId);
  return player;
}

/**
 * Retrieves the Row Index of the given user id
 * @param {string} userId
 * @return {number}
 */
async function getIndexFromSheet(userId) {
  const data = await googleSheetsHandler.retrieveData(config.googleSheetsId, config.googleSheetsRange);
  const fullSheetArray = data.values?data.values:[[]];
  for (let i = 0; i<fullSheetArray.length; i++) {
    if (fullSheetArray[i][1]===userId) {
      return i;
    }
  }
  return -1;
}

/**
 * Retrieves the Index of the Row and the row itself
 * @param {string} userId
 * @return {[number, Array<string>]}
 */
async function getIndexAndRowFromSheet(userId) {
  const data = await googleSheetsHandler.retrieveData(config.googleSheetsId, config.googleSheetsRange);
  const fullSheetArray = data.values?data.values:[[]];
  for (let i = 0; i<fullSheetArray.length; i++) {
    if (fullSheetArray[i][1]===userId) {
      return [i, fullSheetArray[i]];
    }
  }
  return [-1, undefined];
}

/**
 * Updates one cell in the Google Sheet with the given data
 * @param {Array} data
 * @param {string} event
 * @param {DMChannel} channel
 * @param {Array<string>} row
 * @param {number} index
 */
async function updateCellInSheet(data, event, channel, row, index) {
  row[data[0]]=data[1];
  await updateRowInSheet(row, index);
  sendConfirmationMessage(event, channel, row);
}

/**
 * Updates one row in the Google sheet with the given data
 * @param {Array<string>} data
 * @param {number} index
 */
async function updateRowInSheet(data, index) {
  const regex = /^(.+\![A-Z]+)(\d+):([A-Z]+)\d*$/g;
  const match = [...config.googleSheetsRange.matchAll(regex)].flat(1);
  if (match) {
    await googleSheetsHandler.updateData(config.googleSheetsId, {range: `${match[1]}${index+parseInt(match[2])}:${match[3]}${index+parseInt(match[2])}`, values: [data]});
  } else {
    throw new Error('Google Sheets Range does not match Regex', config.googleSheetsRange);
  }
}

/**
 * Sends a confirmation Message requesting the confirmation of the given data
 * @param {string} event
 * @param {DMChannel} channel
 * @param {Array<string>} player
 */
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
        title: language.interactions.signup.confirmation.guild,
        text: player[5],
        inline: true,
      },
      {
        title: language.interactions.signup.confirmation.level,
        text: player[6],
        inline: true,
      },
      {
        title: language.interactions.signup.confirmation.gearscore,
        text: player[7],
        inline: true,
      },
    ],
    buttons: row,
  }));
}

export default {
  getRowFromSheet,
  getIndexFromSheet,
  getIndexAndRowFromSheet,
  updateCellInSheet,
  updateRowInSheet,
  sendConfirmationMessage,
};
