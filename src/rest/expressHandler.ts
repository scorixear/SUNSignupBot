import express, {Request, Response} from 'express';
import config from '../config';
import GoogleSheetsHandler from '../misc/googleSheetsHandler';
import SqlHandler from '../misc/sqlHandler';
import dateHandler from '../misc/dateHandler';

declare const sqlHandler: SqlHandler;
declare const googleSheetsHandler: GoogleSheetsHandler;

export default class ExpressHandler {
  private app;
  constructor () {
    this.app = express();

    this.app.get('/signup', this.signupHandle);

    this.app.get('/events', this.eventsHandle);

    this.app.listen(config.restPort, ()=> {
      console.log(`Express API listening`);
    });
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

    let eventTimestamp: number;
    try {
      const date: Date = dateHandler.getUTCDateFromCETStrings(eventDate, eventTime);
      eventTimestamp = dateHandler.getUTCTimestampFromDate(date);
    } catch (err) {
      console.log('Request denied 404 - date/time wrong format');
      res.status(400).send('"date" and/or "time" are in the wrong format. Expected is: DD.MM.YYYY HH:MM');
      return;
    }

    const eventId: string = await sqlHandler.getEventId(eventName, eventTimestamp.toString());
    if (!eventId) {
      console.log('Request denied 404 - Could not find Event');
      res.status(404).send('Could not find event.');
      return;
    }

    try {
      const returnBody = {players: new Array()};
      const signups: {userId: string, date: number}[] = await sqlHandler.getSignups(eventId);
      signups.sort((a,b)=>a.date - b.date);

      const data = await googleSheetsHandler.retrieveData();
      const fullSheet: string[][] = data.values?data.values:[[]];

      for (const user of signups) {
        const player: string[] = fullSheet.find((subarray: string[])=> subarray[1]===user.userId );
        returnBody.players.push({
          name: player[0],
          discord_long_id: player[1],
          weapon_1: player[2],
          weapon_2: player[3],
          role: player[4],
          guild: player[5],
          level: player[6],
          gear_score: player[7],
          date_of_signup: user.date,
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
    const includeClosed = req.query.includeClosed as string;
    console.log('Events request', includeClosed);
    try {
      const events = await sqlHandler.getEvents(includeClosed !== undefined);
      const responseBody = [];
      for (const event of events) {
        let timeString;
        let dateString;
        [dateString, timeString] = dateHandler.getCESTStringFromDate(new Date(parseInt(event.date, 10)*1000));
        if (timeString.endsWith('CET')) {
          timeString = timeString.substr(0, timeString.length - 4);
        } else {
          timeString = timeString.substr(0, timeString.length - 5);
        }
        responseBody.push({name: event.name, date: dateString, time: timeString});
      }
      res.status(200).send(responseBody);
      console.log('Events request success 200');
    } catch (err) {
      res.status(500).send('Internal error while processing the request');
      console.error(err);
    }
  }
}