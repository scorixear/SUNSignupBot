import {Client, Intents} from 'discord.js';
const client = new Client({
  partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER'],
  intents: [Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILDS]});

export default {client};
