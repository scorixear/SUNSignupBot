import config from '../config';
import messageHandler from '../misc/messageHandler';
import {Message, TextBasedChannels} from 'discord.js';
import signup from './signup';
import { LanguageHandler } from '../misc/languageHandler';

declare const languageHandler: LanguageHandler;

async function createMessageCollector(channel: TextBasedChannels, message: Message, description: string, action: (msg: Message) => void, userId: string) {
  // start collector for one message with timeout of 50 seconds
  const collector = channel.createMessageCollector({filter: (m)=>m.author.id !== process.env.CLIENTID, max: 1, time: 50000});
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