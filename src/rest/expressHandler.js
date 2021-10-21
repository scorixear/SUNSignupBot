import express from 'express';
import config from '../config';
import googleSheetsHandler from '../misc/googleSheetsHandler';
import sqlHandler from '../misc/sqlHandler';

const app = express();

async function init() {
  app.get('/signup', async (req, res) => {
    const eventName = req.query.name;
    const eventDate = req.query.date;
    const eventTime = req.query.time;

    if (!eventName) {
      res.status(400).send('Missing query parameter "name"');
      return;
    } else if (!eventDate) {
      res.status(400).send('Missing query parameter "date"');
      return;
    } else if (!eventTime) {
      res.send(400).send('Missing query parameter "time"');
    }
    let eventDateTime;
    try {
      const dateStrings = eventDate.split('.');
      const timeStrings = eventTime.split(':');
      eventDateTime = Math.floor(new Date(parseInt(dateStrings[2]), parseInt(dateStrings[1]), parseInt(dateStrings[0]), parseInt(timeStrings[0]), parseInt(timeStrings[1])).getTime() / 1000);
    } catch (err) {
      res.status(400).send('"date" and/or "time" are in the wrong format. Expected is: DD.MM.YYYY HH:MM');
      return;
    }

    const eventId = await sqlHandler.getEventId(eventName, eventDateTime);
    if (!eventId) {
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
    } catch (err) {
      res.status(500).send('Something went wrong while retrieving data.');
      console.error(err);
    }
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
