import config from '../../config.js';
import messageHandler from '../../misc/messageHandler.js';
import dateHandler from '../../misc/dateHandler.js';
import { CommandInteraction, TextChannel } from 'discord.js';
import { CommandInteractionHandle } from '../../interactions/interactionHandles';

/**
 *
 * @param eventId
 */
 export async function updateSignupMessage(eventId: string) {
  const eventMessage = await global.sqlHandler.getMessageEvent(eventId);
  try {
    const guild = global.discordHandler.client.guilds.cache.get(eventMessage.guildId);
    try {
      const channel = await guild.channels.fetch(eventMessage.channelId) as TextChannel;
      try {
        const msg = await channel.messages.fetch(eventMessage.messageId);
        const embed = msg.embeds[0];
        const signups = await global.sqlHandler.getSignups(eventId);

        const players: string[][] = await sheetHelper.getSheetData();
        const tanks = []; const healers = []; const melees = []; const ranged = [];
        for (const userId of signups) {
          const member = await guild.members.fetch(userId);
          let username;
          const playerData = players.find((subarray)=> subarray[1]=== userId);
          if (member) {
            username = member.nickname ? member.nickname:member.user.username;
          } else {
            username = playerData[0];
          }
          
          switch (playerData[4]) {
            case 'Melee':
              melees.push(username);
              break;
            case 'Tank':
              tanks.push(username);
              break;
            case 'Healer':
              healers.push(username);
              break;
            case 'Range':
              ranged.push(username);
              break;
          }
        }

        embed.fields[2].value = signups.length.toString();
        embed.fields[3].name = `Tanks (${tanks.length}):`;
        embed.fields[3].value = tanks.length>0?tanks.join('\n'):'\u200b';
        embed.fields[4].name = `Healers (${healers.length}):`;
        embed.fields[4].value = healers.length>0?healers.join('\n'):'\u200b';
        embed.fields[5].name = `Melees (${melees.length}):`;
        embed.fields[5].value = melees.length>0?melees.join('\n'):'\u200b';
        embed.fields[6].name = `Ranged (${ranged.length}):`;
        embed.fields[6].value = ranged.length>0?ranged.join('\n'):'\u200b';
        msg.edit({embeds: [embed], components: msg.components});
      } catch (err) {}
    } catch (err) {}
  } catch (err) {}
}

export async function updateUnavailable(eventId: string, isUnavailable: boolean) {
  const eventMessage = await global.sqlHandler.getMessageEvent(eventId);
  try {
    const guild = global.discordHandler.client.guilds.cache.get(eventMessage.guildId);
    try {
      const channel = await guild.channels.fetch(eventMessage.channelId) as TextChannel;
      try {
        const msg = await channel.messages.fetch(eventMessage.messageId);
        if (msg) {
          const embed = msg.embeds[0];
          embed.fields[7].value = (parseInt(embed.fields[7].value)+(isUnavailable?1:-1)).toString();
          msg.edit({embeds: [embed], components: msg.components});
        }
      } catch (err) {}
    } catch (err) {}
  } catch (err) {}
}

export default class SignupCommand extends CommandInteractionHandle {
  constructor() {
    super(
      'signup', 
      ()=>global.languageHandler.language.commands.signup.description,
      'signup #announcements "Everfall Push" 14.10.2021 12:00 "Sign up for Everfall Push"',
      'Moderation',
      'signup <#channel> <eventName> <date> <CET/CEST Time> <Description>'
    );
  }

  override handle(interaction: CommandInteraction) {

  }
}
