import DiscordHandler from './misc/discordHandler';
import CmdHandler from './misc/commandHandler';
import config from './config';
import interactionHandler from './misc/interactionHandler';
import buttonActionHandler from './misc/buttonActionHandler';
import sqlHandler from './misc/sqlHandler';
import expressHandler from './rest/expressHandler';
import dateHandler from './misc/dateHandler';

DiscordHandler.client.on('ready', ()=> {
  console.log('SUN Signup Bot is online!');
});

DiscordHandler.client.on('messageCreate', CmdHandler?CmdHandler.parseCommand: ()=>{});

process.on('uncaughtException', (err) => {
  console.error('Unhandled exception', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection', reason);
});

sqlHandler.initDB().then(() => {
  buttonActionHandler.initialize();
  interactionHandler.registerInteractions();
  DiscordHandler.client.login(config.token).then(()=> {
    expressHandler.init();
  });
  setInterval(async ()=> {
    const now = new Date();
    now.setHours(now.getHours() - 6);
    const events = await sqlHandler.findDeleteEvents(dateHandler.getUTCTimestampFromDate(now));
    for (const event of events) {
      const message = await sqlHandler.getMessageEvent(event);
      try {
        const guild = DiscordHandler.client.guilds.cache.get(message.guildId);
        try {
          const channel = await guild.channels.fetch(message.channelId);
          try {
            const msg = await channel.messages.fetch(message.messageId);
            try {
              msg.delete();
              console.log('Deleted message for event ' + event);
            } catch (err) {
              console.error(`Couldn't delete message for event ${event}`, err);
              return;
            }
          } catch {
            console.log('Couldn\'t find message for event '+event);
          }
        } catch {
          console.log('Couldn\'t find channel for event '+event);
        }
      } catch {
        console.log('Couldn\'t find guild for event '+event);
      }
      sqlHandler.closeEvent(event);
    }
  }, 1000*60);
});


