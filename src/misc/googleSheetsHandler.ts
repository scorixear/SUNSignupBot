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
  public async appendData(data: {range: string, values: string[][]}) {
    return await this.googleSheetsInstance.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLESHEETSID,
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
  public async updateData(data: {range: string, values: string[][]}) {
    await this.googleSheetsInstance.spreadsheets.values.clear({
      range: data.range,
      spreadsheetId: process.env.GOOGLESHEETSID,
    });
    return await this.googleSheetsInstance.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLESHEETSID,
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
  public async retrieveData() {
    const readData = await this.googleSheetsInstance.spreadsheets.values.get( {
      spreadsheetId: process.env.GOOGLESHEETSID,
      range: process.env.GOOGLESHEETSRANGE,
    });
    return readData.data;
  }

}