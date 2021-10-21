import config from '../config';
import messageHandler from '../misc/messageHandler';
import {dic as language} from '../misc/languageHandler';

async function createMessageCollector(channel, message, description, action) {
  // start collector for one message with timeout of 50 seconds
  const collector = channel.createMessageCollector({filter: (m)=>m.author.id != config.clientId, max: 1, time: 50000});
  collector.next
      .then(async (msg) => {
        action(msg);
      })
      .catch(async (reason)=> {
        message.delete();
        await messageHandler.sendRichTextDefaultExplicit({
          channel: channel,
          title: language.interactions.signup.error.timeout_title,
          description: description,
          color: 0xcc0000,
        });
      });
}

export default {
  createMessageCollector,
};
