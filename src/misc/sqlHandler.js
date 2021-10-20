/* eslint-disable max-len */
import {people} from 'googleapis/build/src/apis/people';
import mariadb from 'mariadb';
import config from '../config';

const pool = mariadb.createPool({
  host: config.dbhost,
  user: config.dbuser,
  password: config.dbpassword,
  port: config.dbport,
  database: config.dbDataBase,
  multipleStatements: true,
  connectionLimit: 5,
});

/**
 * Initializes the DataBase
 */
async function initDB() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('DB Connection established');
    await conn.query('CREATE TABLE IF NOT EXISTS `signup` (`event` VARCHAR(255), `userid` VARCHAR(255), PRIMARY KEY (`event`,`userid`))');
    await conn.query('CREATE TABLE IF NOT EXISTS `events` (`id` INT NOT NULL AUTO_INCREMENT, `name` VARCHAR(255), `date` BIGINT, PRIMARY KEY(`id`), CONSTRAINT UC_Event UNIQUE (name,date))');
    await conn.query('CREATE TABLE IF NOT EXISTS `messageEvents` (`eventId` VARCHAR(255), `messageId` VARCHAR(255), `channelId` VARCHAR(255), `guildId` VARCHAR(255), PRIMARY KEY(`eventId`))');
  } catch (error) {
    throw error;
  } finally {
    if (conn) return conn.end();
  }
}
async function isSignedIn(event, userid) {
  let conn;
  let returnValue = false;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT event FROM signup WHERE \`event\` = ${conn.escape(event)} AND \`userid\` = ${conn.escape(userid)}`);
    if (rows && rows[0]) {
      returnValue = true;
    }
  } catch (err) {
    returnValue = false;
    console.error(err);
  } finally {
    if (conn) await conn.end();
  }
  return returnValue;
}

async function signIn(event, userid) {
  let conn;
  let returnValue = true;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT event FROM signup WHERE \`event\` = ${conn.escape(event)} AND \`userid\` = ${conn.escape(userid)}`);
    if (!rows || !rows[0]) {
      await conn.query(`INSERT INTO signup (event, userid) VALUES (${conn.escape(event)}, ${conn.escape(userid)})`);
    } else {
      throw new Error('already signed in');
    }
  } catch (err) {
    returnValue=false;
    console.error(err);
  } finally {
    if (conn) await conn.end();
  }
  return returnValue;
}

async function signOut(event, userid) {
  let conn;
  let returnValue = true;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT event FROM signup WHERE \`event\` = ${conn.escape(event)} AND \`userid\` = ${conn.escape(userid)}`);
    if (rows && rows[0]) {
      await conn.query(`DELETE FROM signup WHERE \`event\` = ${conn.escape(event)} AND \`userid\` = ${conn.escape(userid)}`);
    } else {
      throw new Error('already signed out');
    }
  } catch (err) {
    returnValue=false;
    console.error(err);
  } finally {
    if (conn) await conn.end();
  }
  return returnValue;
}

async function getSignups(eventId) {
  let conn;
  let returnValue = [];
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT userid FROM signup WHERE event = ${conn.escape(eventId)}`);
    if (rows) {
      for (const row of rows) {
        returnValue.push(row.userid);
      }
    }
  } catch (err) {
    returnValue = [];
    console.error(err);
  } finally {
    if (conn) await conn.end();
  }
  return returnValue;
}

async function deleteOldEvents(date) {
  let conn;
  let returnValue = true;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT id FROM events WHERE date < ${conn.escape(date)}`);
    if (rows && rows[0]) {
      for (const row of rows) {
        await conn.query(`DELETE FROM signup WHERE event = ${conn.escape(row.id)}`);
        await conn.query(`DELETE FROM messageEvents WHERE eventId = ${conn.escape(row.id)}`);
      }
    }
    await conn.query(`DELETE FROM events WHERE date < ${conn.escape(date)}`);
  } catch (err) {
    returnValue = false;
    console.error(err);
  } finally {
    if (conn) await conn.end();
  }
  return returnValue;
}

async function createEvent(eventName, eventDate) {
  let conn;
  let returnValue = -1;
  try {
    conn = await pool.getConnection();
    await conn.query(`INSERT INTO events (name, date) VALUES (${conn.escape(eventName)}, ${conn.escape(eventDate)})`);
    const rows = await conn.query(`SELECT id FROM events WHERE name = ${conn.escape(eventName)} AND date = ${conn.escape(eventDate)}`);
    if (rows && rows[0]) {
      returnValue = rows[0].id;
    }
  } catch (err) {
    returnValue = -1;
    console.error(err);
  } finally {
    if (conn) await conn.end();
  }
  return returnValue;
}

async function deleteEvent(eventName, eventDate) {
  let conn;
  let returnValue = false;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT id FROM events WHERE name = ${conn.escape(eventName)} AND date = ${conn.escape(eventDate)}`);
    if (rows && rows[0]) {
      await conn.query(`DELETE FROM events WHERE id = ${conn.escape(rows[0].id)}`);
      await conn.query(`DELETE FROM signup WHERE event = ${conn.escape(rows[0].id)}`);
      await conn.query(`DELETE FROM messageEvents WHERE eventId = ${conn.escape(rows[0].id)}`);
      returnValue = true;
    }
  } catch (err) {
    returnValue = false;
    console.error(err);
  } finally {
    if (conn) await conn.end();
  }
  return returnValue;
}

async function getEventId(eventName, eventDate) {
  let conn;
  let returnValue = undefined;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT id FROM events WHERE name = ${conn.escape(eventName)} AND date = ${conn.escape(eventDate)}`);
    if (rows && rows[0]) {
      returnValue = rows[0].id;
    }
  } catch (err) {
    returnValue = undefined;
    console.error(err);
  } finally {
    if (conn) await conn.end();
  }
  return returnValue;
}

/**
 *
 * @param {string} eventId
 * @param {string} messageId
 * @param {string} channelId
 * @param {string} guildId
 */
async function createMessageEvent(eventId, messageId, channelId, guildId) {
  let conn;
  let returnValue = false;
  try {
    conn = await pool.getConnection();
    await conn.query(`INSERT INTO messageEvents (eventId, messageId, channelId, guildId) VALUES (${conn.escape(eventId)}, ${conn.escape(messageId)}, ${conn.escape(channelId)}, ${conn.escape(guildId)})`);
    returnValue = true;
  } catch (err) {
    returnValue = false;
    console.error(err);
  } finally {
    if (conn) await conn.end();
  }
  return returnValue;
}

async function getMessageEvent(eventId) {
  let conn;
  let returnValue = {};
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT guildId, channelId, messageId FROM messageEvents WHERE eventId = ${conn.escape(eventId)}`);
    if (rows && rows[0]) {
      returnValue = {
        guildId: rows[0].guildId,
        channelId: rows[0].channelId,
        messageId: rows[0].messageId,
      };
    }
  } catch (err) {
    returnValue = {};
    console.error(err);
  } finally {
    if (conn) await conn.end();
  }
  return returnValue;
}


export default {
  initDB,
  isSignedIn,
  signIn,
  signOut,
  getSignups,
  deleteOldEvents,
  createEvent,
  deleteEvent,
  getEventId,
  createMessageEvent,
  getMessageEvent,
};
