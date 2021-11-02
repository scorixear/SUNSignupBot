import {Guild, Message, MessageActionRow, MessageEmbed, TextBasedChannels, TextChannel, User, UserResolvable} from 'discord.js';

/**
 * Prints a MessageEmbed
 * @param param0
 */
 async function sendRichTextDefault(param0 :{
  msg: Message,
  title: string,
  categories: {title: string, text: string, inline?:boolean}[],
  color: number,
  description: string,
  thumbnail: string,
  url: string,
  components: MessageActionRow[],
}) {
  return await sendRichText(param0.msg, param0.title, param0.categories, param0.color, param0.description, param0.thumbnail, param0.url, param0.components);
}

/**
 * Prints a Message Embed
 */
async function sendRichTextDefaultExplicit(param0: {
  guild: Guild,
  channel: TextChannel,
  author: User,
  title: string,
  categories: {title: string, text: string, inline?: boolean}[],
  color: number,
  description: string,
  thumbnail: string,
  url: string,
  components: MessageActionRow[],
}) {
  return await sendRichTextExplicit(param0.guild, param0.channel, param0.author, param0.title, param0.categories, param0.color, param0.description, param0.thumbnail, param0.url, param0.components);
}

/**
 * Prints a Message Embed
 * @param guild the Guild to print to
 * @param channel the channel to print to
 * @param author the author of the message
 * @param title the title
 * @param categories the fields
 * @param color hex rgb color
 * @param description
 * @param thumbnail thumbnail url string
 * @param url an url
 * @param buttons
 */
async function sendRichTextExplicit(guild: Guild, channel: TextBasedChannels, author: User, title: string, categories: {title: string, text: string, inline?: boolean}[], color: number, description: string, thumbnail: string, url: string, components: MessageActionRow[]) {
  channel.sendTyping();
  const richText: MessageEmbed = new MessageEmbed();
  if (title) {
    richText.setTitle(title);
  }

  if (categories) {
    categories.forEach((category) => {
      richText.addField(category.title, category.text || '\u200b', category.inline || false);
    });
  }
  if (color) {
    richText.setColor(color);
  }
  if (description) {
    richText.setDescription(description);
  }
  if (thumbnail) {
    richText.setThumbnail(thumbnail);
  }

  if (guild && author) {
    const guildMember = await guild.members.fetch(author);
    richText.setFooter(guildMember.nickname?guildMember.nickname.toString():guildMember.user.username.toString(), author.avatarURL());
  }

  richText.setTimestamp(new Date());
  if (url) {
    richText.setURL(url);
  }

  if (components) {
    return channel.send({embeds: [richText], components: components});
  }
  return channel.send({embeds: [richText]});
}

/**
 * Returns a Message Embed
 */
async function getRichTextExplicitDefault(param0: {
  guild: Guild,
  author: User,
  title: string,
  categories: {title: string, text: string, inline?: boolean}[],
  color: number,
  description: string,
  thumbnail: string,
  url: string,
  components: MessageActionRow[],
}) {
  return getRichTextExplicit(param0.guild, param0.author, param0.title, param0.categories, param0.color, param0.description, param0.thumbnail, param0.url, param0.components);
}

async function getRichTextExplicit(guild: Guild, author: User, title: string, categories: {title: string, text: string, inline?: boolean}[], color: number, description: string, thumbnail: string, url: string, components: MessageActionRow[]) {
  const richText: MessageEmbed = new MessageEmbed();
  if (title) {
    richText.setTitle(title);
  }

  if (categories) {
    categories.forEach((category) => {
      richText.addField(category.title, category.text || '\u200b', category.inline || false);
    });
  }
  if (color) {
    richText.setColor(color);
  }
  if (description) {
    richText.setDescription(description);
  }
  if (thumbnail) {
    richText.setThumbnail(thumbnail);
  }

  if (guild && author) {
    const guildMember = await guild.members.fetch(author);
    richText.setFooter(guildMember.nickname?guildMember.nickname.toString():guildMember.user.username.toString(), author.avatarURL());
  }

  richText.setTimestamp(new Date());
  if (url) {
    richText.setURL(url.toString());
  }

  let returnValue: {embeds: MessageEmbed[], components?: MessageActionRow[]} = {embeds: [richText]};

  if (components) {
    returnValue = {embeds: [richText], components: components};
  }
  return returnValue;
}

/**
 * Prints a MessageEmbed
 * @param msg the message object to print from
 * @param title
 * @param categories the fields to add
 * @param color hex rgb number
 * @param image image path
 * @param description
 * @param thumbnail thumbnail url
 * @param url
 * @param buttons
 */
async function sendRichText(msg: Message, title: string, categories: {title: string, text: string, inline?: boolean}[], color: number, description: string, thumbnail: string, url: string, components: MessageActionRow[]) {
  return await sendRichTextExplicit(msg.guild, msg.channel, msg.author,
      title, categories, color, description, thumbnail, url, components);
}

export default {
  sendRichText,
  sendRichTextExplicit,
  sendRichTextDefault,
  sendRichTextDefaultExplicit,
  getRichTextExplicit,
  getRichTextExplicitDefault,
};
