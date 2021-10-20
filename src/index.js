import DiscordHandler from './misc/discordHandler';
import CmdHandler from './misc/commandHandler';
import config from './config';
import interactionHandler from './misc/interactionHandler';
import buttonActionHandler from './misc/buttonActionHandler';
import sqlHandler from './misc/sqlHandler';
import expressHandler from './rest/expressHandler';

DiscordHandler.client.on('ready', ()=> {
  console.log('SUN Signup Bot is online!');
});

DiscordHandler.client.on('messageCreate', CmdHandler?CmdHandler.parseCommand: ()=>{});

sqlHandler.initDB().then(() => {
  buttonActionHandler.initialize();
  interactionHandler.registerInteractions();
  DiscordHandler.client.login(config.token).then(()=> {
    expressHandler.init();
  });
});
