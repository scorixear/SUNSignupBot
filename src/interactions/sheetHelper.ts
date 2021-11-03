import config from '../config';
import {DMChannel, MessageActionRow, MessageButton, TextBasedChannels} from 'discord.js';
import messageHandler from '../misc/messageHandler';
import GoogleSheetsHandler from '../misc/googleSheetsHandler';
import { LanguageHandler } from '../misc/languageHandler';

declare const googleSheetsHandler: GoogleSheetsHandler;
declare const languageHandler: LanguageHandler;

/**
 * Retrieves the Row from a google sheet
 * @param userId
 */
 async function getRowFromSheet(userId: string) {
  // retrieve Players data from signup sheet
  const data = await googleSheetsHandler.retrieveData();
  // if data is empty, .values is missing and we initialize with empty array
  const fullSheetArray = data.values?data.values:[[]];
  // Finds Player Row by their user ID
  const player: string[] = fullSheetArray.find((subarray)=>subarray[1] === userId);
  return player;
}

async function getSheetData() {
  // retrieve Players data from signup sheet
  const data = await googleSheetsHandler.retrieveData();
  // if data is empty, .values is missing and we initialize with empty array
  const fullSheetArray: string[][] = data.values?data.values:[[]];

  return fullSheetArray;
}

/**
 * Retrieves the Row Index of the given user id
 * @param userId
 */
async function getIndexFromSheet(userId: string) {
  const data = await googleSheetsHandler.retrieveData();
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
 * @param userId
 */
async function getIndexAndRowFromSheet(userId: string): Promise<[number, string[]]> {
  const data = await googleSheetsHandler.retrieveData();
  const fullSheetArray: string[][] = data.values?data.values:[[]];
  for (let i = 0; i<fullSheetArray.length; i++) {
    if (fullSheetArray[i][1]===userId) {
      return [i, fullSheetArray[i]];
    }
  }
  return [-1, undefined];
}

/**
 * Updates one cell in the Google Sheet with the given data
 */
async function updateCellInSheet(data: [number, string], event: string, channel: TextBasedChannels, row: string[], index: number) {
  row[data[0]]=data[1];
  await updateRowInSheet(row, index);
  sendConfirmationMessage(event, channel, row);
}

/**
 * Updates one row in the Google sheet with the given data
 */
async function updateRowInSheet(data: string[], index: number) {
  const regex = /^(.+\![A-Z]+)(\d+):([A-Z]+)\d*$/g;
  const match = [...process.env.GOOGLESHEETSRANGE.matchAll(regex)].flat(1);
  if (match) {
    await googleSheetsHandler.updateData({range: `${match[1]}${index+parseInt(match[2], 10)}:${match[3]}${index+parseInt(match[2], 10)}`, values: [data]});
  } else {
    throw new Error('Google Sheets Range does not match Regex '+ config.googleSheetsRange);
  }
}

/**
 * Sends a confirmation Message requesting the confirmation of the given data
 */
async function sendConfirmationMessage(event: string, channel: TextBasedChannels, player: string[]) {
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
    title: languageHandler.language.interactions.signup.confirmation.title,
    description: languageHandler.language.interactions.signup.confirmation.desc,
    categories: [
      {
        title: languageHandler.language.interactions.signup.confirmation.name,
        text: player[0],
        inline: true,
      },
      {
        title: languageHandler.language.interactions.signup.confirmation.weapon1,
        text: player[2],
        inline: true,
      },
      {
        title: languageHandler.language.interactions.signup.confirmation.weapon2,
        text: player[3],
        inline: true,
      },
      {
        title: languageHandler.language.interactions.signup.confirmation.role,
        text: player[4],
        inline: true,
      },
      {
        title: languageHandler.language.interactions.signup.confirmation.guild,
        text: player[5],
        inline: true,
      },
      {
        title: languageHandler.language.interactions.signup.confirmation.level,
        text: player[6],
        inline: true,
      },
      {
        title: languageHandler.language.interactions.signup.confirmation.gearscore,
        text: player[7],
        inline: true,
      },
    ],
    components: [row],
  }));
}

export default {
  getRowFromSheet,
  getSheetData,
  getIndexFromSheet,
  getIndexAndRowFromSheet,
  updateCellInSheet,
  updateRowInSheet,
  sendConfirmationMessage,
};
