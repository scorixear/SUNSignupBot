import { Message, TextChannel } from "discord.js";
import dateHandler from "./dateHandler";
import SqlHandler from "./sqlHandler";

declare const sqlHandler: SqlHandler;

export class IntervalHandlers {
  public static initInterval() {
    setInterval(async () => {
      console.log('Finding removal Messages');
      const now: Date = new Date();
      await this.handleMessageDeletion(now);
      await this.handleButtonRemoval(now);
    }, 1000*60);
  }

  private static async handleMessageDeletion(now: Date) {
    const date = new Date(now.getTime());
    date.setHours(date.getHours() - 1);
    const events: string[] = await sqlHandler.findDeleteEvents(dateHandler.getUTCTimestampFromDate(date).toString());
    for (const event of events) {
      const message = await sqlHandler.getMessageEvent(event);
      try {
        const guild = discordHandler.client.guilds.cache.get(message.guildId);
        try {
          const channel: TextChannel = (await guild.channels.fetch(message.channelId)) as TextChannel;
          try {
            const msg: Message = await channel.messages.fetch(message.messageId);
            try {
              await msg.delete();
              console.log('Deleted message for event ' + event);
            } catch (err) {
              console.error(`Couldn't delete message for event ${event}`, err);
              continue;
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
  }
  private static async handleButtonRemoval(now: Date) {
    const events: string[] = await sqlHandler.findDeleteEvents(dateHandler.getUTCTimestampFromDate(now).toString());
    for(const event of events) {
      const message = await sqlHandler.getMessageEvent(event);
      try {
        const guild = discordHandler.client.guilds.cache.get(message.guildId);
        try {
          const channel: TextChannel = (await guild.channels.fetch(message.channelId)) as TextChannel;
          try {
            const msg: Message = await channel.messages.fetch(message.messageId);
            try {
              if(msg.components.length > 0) {
                await msg.edit({embeds: msg.embeds, components: []});
                console.log('Removed Buttons for event ' + event);
              }
            } catch (err) {
              console.error(`Couldn't remove buttons for event ${event}`, err);
              continue;
            }
          } catch (err) {
            console.log('Couldn\'t find message for event ' + event);
          }
        } catch (err) {
          console.log('Couln\'t find channel for event ' + event);
        }
      } catch (err) {
        console.log('Couldn\'t find guild for event '+ event);
      }
    }
  }
}