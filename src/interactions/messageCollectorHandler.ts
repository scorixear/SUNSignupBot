import config from '../config';
import messageHandler from '../misc/messageHandler';
import {DMChannel, Message, TextBasedChannels} from 'discord.js';
import signup from './signup';

async function createMessageCollector(channel: TextBasedChannels, message: Message, description: string, action: (msg: Message) => void, userId: string) {
  // start collector for one message with timeout of 50 seconds
  const collector = channel.createMessageCollector({filter: (m)=>m.author.id !== config.clientId, max: 1, time: 50000});
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
          channel,
          title: languageHandler.language.interactions.signup.error.timeout_title,
          description,
          color: 0xcc0000,
        });
      });
}

export default {
  createMessageCollector
};