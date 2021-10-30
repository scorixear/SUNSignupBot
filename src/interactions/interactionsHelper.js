import config from '../config';
import messageHandler from '../misc/messageHandler';
import {dic as language} from '../misc/languageHandler';
import {DMChannel} from 'discord.js';
import signup from './signup';

async function createMessageCollector(channel, message, description, action, userId) {
  // start collector for one message with timeout of 50 seconds
  const collector = channel.createMessageCollector({filter: (m)=>m.author.id != config.clientId, max: 1, time: 50000});
  collector.next
      .then(async (msg) => {
        message.delete();
        action(msg);
      })
      .catch(async (reason)=> {
        message.delete();
        if (userId) {
          signup.signupFinished(userId);
        }
        await messageHandler.sendRichTextDefaultExplicit({
          channel: channel,
          title: language.interactions.signup.error.timeout_title,
          description: description,
          color: 0xcc0000,
        });
      });
}

/**
 *
 * @param {DMChannel} channel
 */
async function deleteLastMessage(channel) {
  // get last message send from bot in this channel (the confirm button message)
  const filteredMessages = (await channel.messages.fetch()).filter((message) => message.author.id === config.clientId);
  // and delete it
  if (filteredMessages.size > 0) {
    filteredMessages.first().delete();
  }
}

export default {
  createMessageCollector,
  deleteLastMessage,
};
