import config from '../config';
import msgHandler from './messageHandler';
import Fs from 'fs';
import emojiHandler from './emojiHandler.js';
import levenshteinDistance from './levenshteinDistance';
import {Message} from 'discord.js';
import {dic as language, replaceArgs} from './languageHandler';

const commandFiles = Fs.readdirSync('./src/commands');
const commands = [];
commandFiles.forEach((folder) => {
  if (folder !== 'command.js') {
    Fs.readdirSync(`./src/commands/${folder}/`).forEach((file)=> {
      if (file.endsWith('.js')) {
        const command = require(`./../commands/${folder}/${file}`);
        if (command.commands) {
          for (const cmd of command.commands) {
            commands.push(Reflect.construct(cmd, [folder]));
          }
        } else {
          commands.push(Reflect.construct(command.default, [folder]));
        }
      }
    });
  }
});


/**
 * parses the Command
 * @param {Message} msg
 */
function parseCommand(msg) {
  let module;
  let command;
  let args;
  let params;
  // if does not start with prefix, return;
  if (msg.content[0] !== config.botPrefix) return;
  else {
    const temp = parseCommandParams(msg);
    if (!temp) return;
    command = temp.command;
    args = temp.args;
    params = temp.params;
    module = commands.find((c) => c.command.toLowerCase() == command.toLowerCase());
  }
  if (!module || !module.executeCommand) {
    const commandOptions = commands.map((c)=>c.command);
    const message = replaceArgs(language.handlers.command.error.unknown, [config.botPrefix]);
    const possible = levenshteinDistance.findClosestMatch(command.toLowerCase(), commandOptions);
    emojiHandler.resolveWithReaction(msg, message, possible, msg.content.substring(command.length + 1), (c, m, a)=> {
      module = commands.find((x)=> x.command.toLowerCase() == c.toLowerCase());
      module.executeCommand(a[0], m, a[1]);
    }, [args, params]);
    return;
  }
  try {
    module.executeCommand(args, msg, params);
  } catch (err) {
    console.log(err);
    msgHandler.sendRichText(msg, language.general.error, [{
      title: language.general.message,
      text: replaceArgs(language.handlers.command.error.generic_error, [config.botPrefix, command]),
    }]);
  }
}

/**
 * Parses a string to arguments
 * @param {Message} msg
 * @param {string} messageargs the string to parse
 * @return {Array<string>}
 */
function parseArgs(msg, messageargs) {
  const argsRegex = /(?: +([^ "]+|"[^"]*"))/g;
  if (!argsRegex.test(messageargs)) {
    msgHandler.sendRichText(msg, language.general.error, [{
      title: language.general.message,
      text: language.handlers.command.error.args_format,
    }]);
    return;
  }
  argsRegex.lastIndex = 0;
  const argsArray = [];
  let temp;
  while (temp = argsRegex.exec(messageargs)) {
    if (temp[1].startsWith('"') && temp[1].endsWith('"')) {
      argsArray.push(temp[1].substring(1, temp[1].length - 1));
    } else {
      argsArray.push(temp[1]);
    }
  }
  return argsArray;
}

/**
 * Parses a string for parameters
 * @param {Message} msg
 * @param {string} messageParams the string to parse for params
 * @return {{}}
 */
function parseParams(msg, messageParams) {
  const paramsRegex = / +(--[^ ]+)(?: +([^ "-]+|"[^"]*"))?/g;
  if (!paramsRegex.test(messageParams)) {
    msgHandler.sendRichText(msg, language.general.error, [{
      title: language.general.message,
      text: language.handlers.command.error.params_format,
    }]);
    return;
  }
  paramsRegex.lastIndex = 0;
  const rawParams = [];
  let temp;
  while (temp = paramsRegex.exec(messageParams)) {
    rawParams.push(temp[1]);
    if (temp[2]) {
      rawParams.push(temp[2]);
    }
  }
  let lastOption;
  const params = {};
  for (let i = 0; i < rawParams.length; i++) {
    let current = rawParams[i];
    if (current.startsWith('--')) {
      lastOption = current.substring(2);
      params[lastOption] = '';
    } else {
      if (current.startsWith('"') && current.endsWith('"')) {
        current = current.substring(1, current.length - 1);
      }
      params[lastOption] = current;
    }
  }
  return params;
}

/**
 * Parses a string into args and params without expecting a command
 * @param {Message} msg the message object to send
 * @param {Array<string>} attributes the attributes string to parse
 * @param {string} generalError the general error to print
 * @return {{args: Array<string>, params: {}}}
 */
function parseWithoutCommand(msg, attributes, generalError) {
  const regex = /^((?:(?!--).)+)?( +--.+)?$/;
  if (!regex.test(attributes)) {
    msgHandler.sendRichText(msg, language.general.error, [{
      title: language.general.message,
      text: generalError,
    }]);
    return;
  }

  const regexSplit = regex.exec(attributes);
  let args = regexSplit[1];
  let params = regexSplit[2];
  if (args) {
    args = parseArgs(msg, ' '+args);
  } else {
    args = [];
  }
  if (params) {
    params = parseParams(msg, params);
  } else {
    params = {};
  }
  return {args: args, params: params};
}

/**
 * Parses a command from the given msg object
 * @param {Message} msg the message object to parse from
 * @return {{command: String, args: Array<String>, params: {}}} the parsed command
 */
function parseCommandParams(msg) {
  const regex = new RegExp('^\\'+`${config.botPrefix}([^ ]+)((?:(?!--).)+)?( +--.+)?$`);
  if (!regex.test(msg.content)) {
    msgHandler.sendRichText(msg, language.general.error, [{
      title: language.general.message,
      text: replaceArgs(language.handlers.command.error.general_format, [config.botPrefix]),
    }]);
    return;
  }
  const regexSplit = regex.exec(msg.content);
  const command = regexSplit[1];
  let args = regexSplit[2];
  let params = regexSplit[3];
  if (args) {
    args = parseArgs(msg, args);
  } else {
    args = [];
  }
  if (params) {
    params = parseParams(msg, params);
  } else {
    params = {};
  }
  return {command: command, args: args, params: params};
}

export default {
  parseCommand,
  commands,
};
