import discordHandler from './discordHandler';
import messageHandler from './messageHandler';
import {dic as language} from './languageHandler.js';
// eslint-disable-next-line no-unused-vars
import {Guild, GuildEmoji, Message} from 'discord.js';

const numbers = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
const numberString = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

/**
 * Finds a custom emoji of the given guild
 * @param {*} name the name of the emoji (or a number)
 * @param {Guild} guild the guild to look for
 * @return {GuildEmoji} the found guild emoji
 */
function getCustomGuildEmoji(name, guild) {
  if (!isNaN(name)) {
    name = numberString[name];
  }
  return guild.emojis.cache.find((emoji) => {
    return emoji.name === name;
  });
}

/**
 * Finds a custom emoji of the client
 * @param {*} name the name of the emoji (or a number)
 * @return {GuildEmoji} the found Emoji
 */
function getCustomClientEmoji(name) {
  if (!isNaN(name)) {
    name = numberString[name];
  }
  return discordHandler.client.emojis.cache.find((emoji) => {
    return emoji.name === name;
  });
}

/**
 * Transforms given numbers to emoji numbers
 * @param {number} number the number to transfrom
 * @return {string} the emoji
 */
function getGlobalDiscordEmoji(number) {
  return numbers[number];
}

/**
 * Transforms the given emoji number to a number
 * @param {string} emoji the emoji to transform
 * @return {number} the number
 */
function getNumberFromEmoji(emoji) {
  return numbers.indexOf(emoji);
}

/**
 * This callback is displayed as part of the resolveWithReaction funciton
 * @callback resolveCallback
 * @param {string} option the chosen option
 * @param {Message} msg the given Message Object
 * @param {*} args the passed additional arguments
 */

/**
 * Gives the user a choice and resolves it via Reaction.
 * @param {Message} msg the Message object for sending
 * @param {string} messageString The general information string
 * @param {Array<string>} options The available options to choose
 * @param {string} join additional added string for each option
 * @param {resolveCallback} method function to execute
 * @param {*} additionalArguments additional arguments, that will be passed through to the method
 */
async function resolveWithReaction(msg, messageString, options, join, method, additionalArguments) {
  const reactEmojis = [];
  let commandList;
  if (options && options.length > 0) {
    commandList = language.handlers.emoji.labels.did_you_mean;
    for (let i = 0; i<options.length; i++) {
      const emoji = getGlobalDiscordEmoji(i);
      commandList += `\n${emoji} \`${options[i]}`;
      reactEmojis.push(emoji);
      if (join.length > 0) {
        commandList += `${join}`;
      }
      commandList += '`';
    }
  }

  const categories = [{
    title: language.general.message,
    text: messageString,
  }];
  if (commandList) {
    categories.push({
      title: language.handlers.emoji.labels.synonyms,
      text: commandList,
    });
    categories.push({
      title: language.general.usage,
      text: language.handlers.emoji.labels.usage,
    });
  }

  const message = await messageHandler.sendRichText(msg, language.general.error, categories).then((m) => {
    reactEmojis.forEach((e)=>m.react(e));
    return m;
  });
  const collected = await message.awaitReactions({
    filter: (react, user) => reactEmojis.includes(react.emoji.name) && user.id === msg.author.id,
    max: 1,
    time: 60000,
  });
  const reaction = collected.first();
  method(options[getNumberFromEmoji(reaction.emoji.name)], msg, additionalArguments);
}

export default {
  getCustomClientEmoji,
  getCustomGuildEmoji,
  getGlobalDiscordEmoji,
  getNumberFromEmoji,
  resolveWithReaction,
};
