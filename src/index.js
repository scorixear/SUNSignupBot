import DiscordHandler from './misc/discordHandler';
import CmdHandler from './misc/commandHandler';
import config from './config';
import interactionHandler from './misc/interactionHandler';
import buttonActionHandler from './misc/buttonActionHandler';

DiscordHandler.client.on('ready', ()=> {
  console.log('SUN Signup Bot is online!');
});

DiscordHandler.client.on('messageCreate', CmdHandler?CmdHandler.parseCommand: ()=>{});

buttonActionHandler.initialize();
interactionHandler.registerInteractions();

DiscordHandler.client.login(config.token);
