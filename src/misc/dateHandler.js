/**
 *
 * @param {string} date
 * @param {string} time
 * @return {[Date, boolean]}
 */
function getUTCDateFromCETStrings(date, time) {
  const dateStrings = date.split('.');
  const [hours, minutes] = time.split(':');

  const serverDate = new Date(Date.UTC(parseInt(dateStrings[2]), parseInt(dateStrings[1]) - 1, parseInt(dateStrings[0]), parseInt(hours), parseInt(minutes)));
  if (isCEST(serverDate)) {
    serverDate.setHours(serverDate.getHours()-2);
  } else {
    serverDate.setHours(serverDate.getHours()-1);
  }
  return serverDate;
}

function isCEST(date) {
  const dateTime = date.getTime();
  const cestDateStart = new Date();
  const cestDateFinish = new Date();
  cestDateStart.setTime(Date.parse('29 March '+date.getFullYear() + ' 02:00:00 GMT+0100'));
  cestDateFinish.setTime(Date.parse('25 October '+date.getFullYear() + ' 03:00:00 GMT+0200'));
  const cestDateStartTime = cestDateStart.getTime();
  const cestDateFinishTime = cestDateFinish.getTime();

  return dateTime >= cestDateStartTime && dateTime <= cestDateFinishTime;
}

/**
 *
 * @param {Date} date
 * @return {number}
 */
function getUTCTimestampFromDate(date) {
  return Math.floor(date.getTime() / 1000);
}


/**
 *
 * @param {number} timestamp
 * @return {Date}
 */
function getDateFromUTCTimestamp(timestamp) {
  return new Date(timestamp*1000);
}

/**
 *
 * @param {Date} date
 * @return {[string, string]}
 */
function getCESTStringFromDate(date) {
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset()*60*1000);
  let suffix;
  if (isCEST(date)) {
    suffix = 'CEST';
    utcDate.setHours(utcDate.getHours() + 2);
  } else {
    suffix = 'CET';
    utcDate.setHours(utcDate.getHours() + 1);
  }

  const day = utcDate.getDate();
  const month = utcDate.getMonth()+1;
  const year = utcDate.getFullYear();
  const hours = utcDate.getHours();
  const minutes = utcDate.getMinutes();


  return [`${day<10?'0'+day:day}.${month<10?'0'+month:month}.${year}`, `${hours<10?'0'+hours:hours}:${minutes<10?'0'+minutes:minutes} ${suffix}`];
}

export default {
  getUTCDateFromCETStrings,
  getUTCTimestampFromDate,
  getDateFromUTCTimestamp,
  getCESTStringFromDate,
};
