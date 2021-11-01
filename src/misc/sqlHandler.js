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
    await conn.query('CREATE TABLE IF NOT EXISTS `events` (`id` INT NOT NULL AUTO_INCREMENT, `name` VARCHAR(255), `date` BIGINT, `is_closed` BIT DEFAULT 0, PRIMARY KEY(`id`), CONSTRAINT UC_Event UNIQUE (name,date))');
    await conn.query('CREATE TABLE IF NOT EXISTS `messageEvents` (`eventId` VARCHAR(255), `messageId` VARCHAR(255), `channelId` VARCHAR(255), `guildId` VARCHAR(255), PRIMARY KEY(`eventId`))');
    await conn.query('CREATE TABLE IF NOT EXISTS `unavailable` (`eventId` VARCHAR(255), `userId` VARCHAR(255), PRIMARY KEY (`eventId`,`userId`))');
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
      await conn.query(`DELETE FROM unavailable WHERE eventId = ${conn.escape(rows[0].id)}`);
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
 * @param {string} timestamp
 * @return {Array<string>}
 */
async function findDeleteEvents(timestamp) {
  let conn;
  let returnValue = [];
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT id FROM events WHERE date < ${conn.escape(timestamp)} AND is_closed = 0`);
    if (rows) {
      for (const row of rows) {
        returnValue.push(row.id);
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

async function closeEvent(eventId) {
  let conn;
  let returnValue = false;
  try {
    conn = await pool.getConnection();
    await conn.query(`UPDATE events SET is_closed = 1 WHERE id = ${conn.escape(eventId)}`);
    returnValue = true;
  } catch (err) {
    returnValue = false;
    console.error(err);
  } finally {
    if (conn) await conn.end();
  }
  return returnValue;
}

async function getEvents(includeClosed) {
  let conn;
  let returnValue = [];
  try {
    conn = await pool.getConnection();
    let rows;
    if (includeClosed) {
      rows = await conn.query(`SELECT name, date FROM events`);
    } else {
      rows = await conn.query(`SELECT name, date FROM events WHERE is_closed = 0`);
    }
    if (rows) {
      for (const row of rows) {
        returnValue.push({name: row.name, date: row.date});
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

/**
 *
 * @param {string} eventId
 * @return {{guildId: string, channelId: string, messageId: string}}
 */
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

async function isUnavailable(eventId, userId) {
  let conn;
  let returnValue = false;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT eventId FROM unavailable WHERE eventId = ${conn.escape(eventId)} AND userId = ${conn.escape(userId)}`);
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

async function setUnavailable(eventId, userId) {
  let conn;
  let returnValue = false;
  try {
    conn = await pool.getConnection();
    await conn.query(`INSERT INTO unavailable (eventId, userId) VALUES(${conn.escape(eventId)}, ${conn.escape(userId)})`);
    returnValue = true;
  } catch (err) {
    returnValue = false;
    console.error(err);
  } finally {
    if (conn) await conn.end();
  }
  return returnValue;
}

async function removeUnavailable(eventId, userId) {
  let conn;
  let returnValue = false;
  try {
    conn = await pool.getConnection();
    await conn.query(`DELETE FROM unavailable WHERE eventId = ${conn.escape(eventId)} AND userId = ${conn.escape(userId)}`);
    returnValue = true;
  } catch (err) {
    returnValue = false;
    console.error(err);
  } finally {
    if (conn) await conn.end();
  }
  return returnValue;
}

async function getUnavailables(eventId) {
  let conn;
  let returnValue = [];
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT userId FROM unavailable WHERE eventId = ${conn.escape(eventId)}`);
    if (rows) {
      for (const row of rows) {
        returnValue.push(row.userId);
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


export default {
  initDB,
  isSignedIn,
  signIn,
  signOut,
  getSignups,
  createEvent,
  deleteEvent,
  getEventId,
  findDeleteEvents,
  closeEvent,
  getEvents,
  createMessageEvent,
  getMessageEvent,
  isUnavailable,
  setUnavailable,
  removeUnavailable,
  getUnavailables,
};
