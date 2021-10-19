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
    console.log('Start DB Connection');
    conn = await pool.getConnection();
    console.log('DB Connection established');
    await conn.query('CREATE TABLE IF NOT EXISTS `signup` (`event` VARCHAR(255), `userid` VARCHAR(255), PRIMARY KEY (`event`,`userid`))');
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

export default {
  initDB,
  isSignedIn,
  signIn,
  signOut,
};
