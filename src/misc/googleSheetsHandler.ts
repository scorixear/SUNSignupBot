import {Auth, google, sheets_v4} from 'googleapis';
export default class GoogleSheetsHandler {
  private googleSheetsInstance: sheets_v4.Sheets;

  constructor() {
    this.googleSheetsInstance = google.sheets('v4');
    const auth: Auth.GoogleAuth = new google.auth.GoogleAuth({
      keyFile: './src/assets/keys.json',
      // Scopes can be specified either as an array or as a single, space-delimited string.
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });

    // Acquire an auth client, and bind it to all future calls
    auth.getClient().then((authClient)=> {
      google.options({auth: authClient});
    });
  }

  /**
   * Appends data to the google sheet.
   * @param sheetId the sheet id to edit
   * @param data the data to insert
   * @return the response from the google sheets api
   */
  public async appendData(sheetId: string, data: {range: string, values: string[][]}) {
    return await this.googleSheetsInstance.spreadsheets.values.append({
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
   * @param sheetId the sheet id to edit
   * @param data the data to update
   * @return the response from the google sheets api
   */
  public async updateData(sheetId: string, data: {range: string, values: string[][]}) {
    await this.googleSheetsInstance.spreadsheets.values.clear({
      range: data.range,
      spreadsheetId: sheetId,
    });
    return await this.googleSheetsInstance.spreadsheets.values.update({
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
   * @param sheetId
   * @param range
   * @return
   */
  public async retrieveData(sheetId: string, range: string) {
    const readData = await this.googleSheetsInstance.spreadsheets.values.get( {
      spreadsheetId: sheetId,
      range,
    });
    return readData.data;
  }

}