import express, {response} from 'express';
import config from '../config';
import googleSheetsHandler from '../misc/googleSheetsHandler';
import sqlHandler from '../misc/sqlHandler';
import dateHandler from '../misc/dateHandler';

const app = express();


async function signupHandle(req, res) {
  const eventName = req.query.name;
  const eventDate = req.query.date;
  const eventTime = req.query.time;
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

  let eventTimestamp;
  try {
    const date = dateHandler.getUTCDateFromCETStrings(eventDate, eventTime);
    eventTimestamp = dateHandler.getUTCTimestampFromDate(date);
  } catch (err) {
    console.log('Request denied 404 - date/time wrong format');
    res.status(400).send('"date" and/or "time" are in the wrong format. Expected is: DD.MM.YYYY HH:MM');
    return;
  }

  const eventId = await sqlHandler.getEventId(eventName, eventTimestamp);
  if (!eventId) {
    console.log('Request denied 404 - Could not find Event');
    res.status(404).send('Could not find event.');
    return;
  }

  try {
    const returnBody = {players: []};
    const signups = await sqlHandler.getSignups(eventId);

    const data = await googleSheetsHandler.retrieveData(config.googleSheetsId, config.googleSheetsRange);
    const fullSheet = data.values?data.values:[[]];

    for (const id of signups) {
      const player = fullSheet.find((subarray)=>subarray[1]===id);
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

/**
 *
 * @param {express.Request<{}, any, any, QueryString.ParsedQs, Record<string, any>>} req
 * @param {express.Response<any, Record<string, any>, number>} res
 */
async function eventsHandle(req, res) {
  const includeClosed = req.query.includeClosed;
  console.log('Events request', includeClosed);
  try {
    const events = await sqlHandler.getEvents(includeClosed);
    const responseBody = [];
    for (const event of events) {
      const [dateString, timeString] = dateHandler.getCESTStringFromDate(new Date(event.date*1000));
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

async function init() {
  app.get('/signup', async (req, res) => {
    await signupHandle(req, res);
  });

  app.get('/events', async (req, res) => {
    await eventsHandle(req, res);
  });

  const server = app.listen(config.restPort, ()=> {
    const host = server.address().address;
    const port = server.address().port;
    console.log(`Express API listening at https://${host}:${port}`);
  });
}

export default {
  init,
};
