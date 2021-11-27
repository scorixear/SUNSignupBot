import { Message, MessageActionRow, MessageButton, TextChannel } from "discord.js";
import dateHandler from "./dateHandler";
import messageHandler from "./messageHandler";
import SqlHandler from "./sqlHandler";

declare const sqlHandler: SqlHandler;

export class IntervalHandlers {
  public static initInterval() {
    setInterval(async () => {
      const now: Date = new Date();
      await this.handleMessageDeletion(now);
      await this.handleButtonRemoval(now);
      await this.handleReminder(now);
    }, 1000*60);
  }

  private static async handleMessageDeletion(now: Date) {
    const date = new Date(now.getTime());
    date.setHours(date.getHours() - 1);
    const events: string[] = await sqlHandler.findDeleteEvents(dateHandler.getUTCTimestampFromDate(date).toString());
    for (const event of events) {
      const msg = await this.getMessageForEvent(event);
      if(msg) {
        try {
          await msg.delete();
          console.log('Deleted message for event ' + event);
        } catch (err) {
          console.error(`Couldn't delete message for event ${event}`, err);
        }
        await sqlHandler.removeMessageEvent(event, msg.id, msg.channel.id, msg.guild.id);
        const reminders = await sqlHandler.getReminders(event);
        for(const reminder of reminders) {
          const reminderMsg = await this.getDiscordMessage(event, reminder.messageId, reminder.channelId, reminder.guildId);
          if(reminderMsg) {
            try {
              await reminderMsg.delete();
              console.log('Delete reminder for event ' + event);
            } catch (err) {
              console.error(`Couldn't delete message for event ${event}`, err);
            }
            await sqlHandler.removeReminder(event, reminder.messageId, reminder.channelId, reminder.guildId);
          }
        }
      }
      sqlHandler.closeEvent(event);
    }
  }
  private static async handleButtonRemoval(now: Date) {
    const events: string[] = await sqlHandler.findDeleteEvents(dateHandler.getUTCTimestampFromDate(now).toString());
    for(const event of events) {
      const msg = await this.getMessageForEvent(event);
      if(msg) {
        try {
          if(msg.components.length === 0 || msg.components[0].components.length > 1) {
            const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('Closed')
                    .setLabel('Closed')
                    .setStyle('DANGER')
                    .setDisabled(true));
            await msg.edit({embeds: msg.embeds, components: [row]});
            console.log('Removed Buttons for event ' + event);
          }
        } catch (err) {
          console.error(`Couldn't remove buttons for event ${event}`, err);
          continue;
        }
      }
    }
  }

  private static async handleReminder(now: Date) {
    const events:  {name: string, date: string}[] = await sqlHandler.getEvents(false);
    for (const event of events) {
      const eventDate: Date = new Date(parseInt(event.date, 10)*1000);
      const diff = eventDate.getTime() - now.getTime();
      if (diff < 24*60*60*1000) {
        const eventId = await sqlHandler.getEventId(event.name, event.date);
        const users = await sqlHandler.getSignups(eventId);
        const unavailable = await sqlHandler.getUnavailables(eventId);
        if (unavailable.length + users.length < 60) {
          const messages = await sqlHandler.getReminders(eventId);
          if (((messages.length > 0 && !messages.find(msg => msg.type === 0)) || messages.length === 0) && now.getHours() === 9 && now.getMinutes() === 0) {
            const eventMsg = await this.getMessageForEvent(eventId);
            if(eventMsg) {
              const msg = await eventMsg.reply(await messageHandler.getRichTextExplicitDefault({
                guild: eventMsg.guild,
                title: languageHandler.language.messages.reminder.early_title,
                description: languageHandler.replaceArgs(languageHandler.language.messages.reminder.early_description,[event.name, dateHandler.getCESTStringFromDate(eventDate).join(' ')])
              }));
              await sqlHandler.addReminder(eventId, msg.id, msg.channel.id, msg.guild.id, 0);
            }
          } else if (((messages.length > 0 && !messages.find(msg => msg.type === 1)) || messages.length === 0) && diff <= 3*60*60*1000 && diff >= 3*59*60*1000) {
            const eventMsg = await this.getMessageForEvent(eventId);
            if(eventMsg) {
              const msg = await eventMsg.reply(await messageHandler.getRichTextExplicitDefault({
                guild: eventMsg.guild,
                title: languageHandler.language.messages.reminder.hours_title,
                description: languageHandler.replaceArgs(languageHandler.language.messages.reminder.hours_description,[event.name, dateHandler.getCESTStringFromDate(eventDate).join(' ')])
              }));
              await sqlHandler.addReminder(eventId, msg.id, msg.channel.id, msg.guild.id, 1);
            }
          }
        }
      }
    }
  }

  private static async getMessageForEvent(eventId: string) {
    const message = await sqlHandler.getMessageEvent(eventId);
    return this.getDiscordMessage(eventId, message.messageId, message.channelId, message.guildId);
  }

  private static async getDiscordMessage(eventId: string, messageId: string, channelId: string, guildId: string) {
    try {
      const guild = discordHandler.client.guilds.cache.get(guildId);
      try {
        const channel: TextChannel = (await guild.channels.fetch(channelId)) as TextChannel;
        try {
          return await channel.messages.fetch(messageId);
        } catch (err) {
          console.log('Couldn\'t find message for event ' + eventId);
        }
      } catch (err) {
        console.log('Couldn\'t find channel for event ' + eventId);
      }
    } catch (err) {
      console.log('Couldn\'t find guild for event '+ eventId);
    }
    return undefined;
  }
}