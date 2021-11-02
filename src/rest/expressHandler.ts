import express, {Request, Response} from 'express';
import config from '../config';
import GoogleSheetsHandler from '../misc/googleSheetsHandler';
import SqlHandler from '../misc/sqlHandler';
import dateHandler from '../misc/dateHandler';

export default class ExpressHandler {
  private app;
  private sqlHandler: SqlHandler;
  private googleSheetsHandler: GoogleSheetsHandler;

  constructor (sqlHandler: SqlHandler, googleSheetsHandler: GoogleSheetsHandler) {
    this.app = express();

    this.app.get('/signup', this.signupHandle);
  
    this.app.get('/events', this.eventsHandle);
  
    this.app.listen(config.restPort, ()=> {
      console.log(`Express API listening`);
    });
    this.sqlHandler = sqlHandler;
    this.googleSheetsHandler = googleSheetsHandler;
  }

  private async signupHandle(req: Request, res: Response) {
    const eventName: string = req.query.name as string;
    const eventDate: string = req.query.date as string;
    const eventTime: string = req.query.time as string;
    console.log('Request received', eventName, eventDate, eventTime);
    if (!eventName) {
      res.status(400).send('Missing query parameter "name"');
      console.log('Request denied 400 - missing name');
      return;
    } else if (!eventDate) {
      res.status(400).send('Missing query parameter "date"');
      console.log('Request denied 400 - missing date');
      return;
    } else if (!eventTime) {
      res.send(400).send('Missing query parameter "time"');
      console.log('Request denied 400 - missing time');
      return;
    }
  
    let eventTimestamp: string;
    try {
      const date: Date = dateHandler.getUTCDateFromCETStrings(eventDate, eventTime);
      eventTimestamp = dateHandler.getUTCTimestampFromDate(date);
    } catch (err) {
      console.log('Request denied 404 - date/time wrong format');
      res.status(400).send('"date" and/or "time" are in the wrong format. Expected is: DD.MM.YYYY HH:MM');
      return;
    }
  
    const eventId: string = await this.sqlHandler.getEventId(eventName, eventTimestamp);
    if (!eventId) {
      console.log('Request denied 404 - Could not find Event');
      res.status(404).send('Could not find event.');
      return;
    }
  
    try {
      const returnBody = {players: new Array()};
      const signups: string[] = await this.sqlHandler.getSignups(eventId);
  
      const data = await this.googleSheetsHandler.retrieveData(config.googleSheetsId, config.googleSheetsRange);
      const fullSheet: string[][] = data.values?data.values:[[]];
  
      for (const id of signups) {
        const player: string[] = fullSheet.find((subarray: string[])=> subarray[1]===id );
        returnBody.players.push({
          name: player[0],
          discord_long_id: player[1],
          weapon_1: player[2],
          weapon_2: player[3],
          role: player[4],
          guild: player[5],
          level: player[6],
          gear_score: player[7],
        });
      }
      res.status(200).send(returnBody);
      console.log('Request Success 200');
    } catch (err) {
      res.status(500).send('Something went wrong while retrieving data.');
      console.log('Request denied 500 - internal error');
      console.error(err);
    }
  }

  private async eventsHandle(req: Request, res: Response) {

  }
} 