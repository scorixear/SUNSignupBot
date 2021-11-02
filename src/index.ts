import DiscordHandler from './misc/discordHandler';
import GoogleSheetsHandler from './misc/googleSheetsHandler';
import InteractionHandler from './misc/interactionHandler';
import SqlHandler from './misc/sqlHandler';
import ExpressHandler from './rest/expressHandler';
import dateHandler from './misc/dateHandler';
import { Message, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import { LanguageHandler } from './misc/languageHandler';

// initialize configuration
dotenv.config();

declare global {
  var discordHandler: DiscordHandler;
  var sqlHandler: SqlHandler;
  var googleSheetsHandler: GoogleSheetsHandler;
  var languageHandler: LanguageHandler;
  var interactionHandler: InteractionHandler;
}
global.languageHandler = new LanguageHandler();
global.googleSheetsHandler = new GoogleSheetsHandler();
global.interactionHandler = new InteractionHandler();
global.discordHandler = new DiscordHandler();
global.sqlHandler = new SqlHandler();


discordHandler.client.on('interactionCreate', (interaction)=> global.interactionHandler.handle(interaction));



process.on('uncaughtException', (err: Error) => {
  console.error('Unhandled exception', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection', reason);
});

sqlHandler.initDB().then(async () => {
  await discordHandler.client.login(process.env.DISCORD_TOKEN).then(()=> new ExpressHandler(sqlHandler, googleSheetsHandler));
  await interactionHandler.Init();
  console.log('SUN Signup Bot live!')
  setInterval(async ()=> {
    const now: Date = new Date();
    now.setHours(now.getHours() - 6);
    const events: string[] = await sqlHandler.findDeleteEvents(dateHandler.getUTCTimestampFromDate(now).toString());
    for (const event of events) {
      const message = await sqlHandler.getMessageEvent(event);
      try {
        const guild = discordHandler.client.guilds.cache.get(message.guildId);
        try {
          const channel: TextChannel = (await guild.channels.fetch(message.channelId)) as TextChannel;
          try {
            const msg: Message = await channel.messages.fetch(message.messageId);
            try {
              msg.delete();
              console.log('Deleted message for event ' + event);
            } catch (err) {
              console.error(`Couldn't delete message for event ${event}`, err);
              return;
            }
          } catch (err) {
            console.log('Couldn\'t find message for event '+event);
          }
        } catch (err) {
          console.log('Couldn\'t find channel for event '+event);
        }
      } catch (err) {
        console.log('Couldn\'t find guild for event '+event);
      }
      sqlHandler.closeEvent(event);
    }
  }, 1000*60);
});

