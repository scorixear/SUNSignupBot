import {google} from 'googleapis';
const googleSheetsInstance = google.sheets('v4');

async function init() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './src/assets/keys.json',
    // Scopes can be specified either as an array or as a single, space-delimited string.
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  // Acquire an auth client, and bind it to all future calls
  const authClient = await auth.getClient();
  google.options({auth: authClient});
}

init();

/**
 * Appends data to the google sheet.
 * @param { string } sheetId the sheet id to edit
 * @param { { range: string, values: Array<Array<string>> }} data the data to insert
 * @return { * } the response from the google sheets api
 */
async function appendData(sheetId, data) {
  return await googleSheetsInstance.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: data.range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: data.values,
    },
  });
}

/**
 * Updates data of a google sheet.
 * @param { string } sheetId the sheet id to edit
 * @param { { range: string, values: Array<Array<string>> } } data the data to update
 * @return { * } the response from the google sheets api
 */
async function updateData(sheetId, data) {
  await googleSheetsInstance.spreadsheets.values.clear({
    range: data.range,
    spreadsheetId: sheetId,
  });
  return await googleSheetsInstance.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: data.range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: data.values,
    },
  });
}

/**
 *
 * @param {string} sheetId
 * @param { string } range
 * @return { { range: string, majorDimension: string, values: Array<Array<string>> }}
 */
async function retrieveData(sheetId, range) {
  const readData = await googleSheetsInstance.spreadsheets.values.get( {
    spreadsheetId: sheetId,
    range: range,
  });
  return readData.data;
}


export default {appendData, updateData, retrieveData};
