/* eslint-disable no-unused-vars */
import Discord from 'discord.js';

/**
 * Prints a MessageEmbed
 * @param {{msg: Discord.Message, title: string, categories: Array<{title: string, text: string, inline: boolean}>, color: number, image: string, description: string, thumbnail: string, url: string, buttons: {}}} param0
 * @return {Promise<Discord.Message>}
 */
async function sendRichTextDefault({
  msg,
  title,
  categories,
  color,
  image,
  description,
  thumbnail,
  url,
  buttons,
}) {
  return await sendRichText(msg, title, categories, color, image, description, thumbnail, url, buttons);
}

/**
 * Prints a Message Embed
 * @param {{guild: Discord.Guild, channel: Discord.TextChannel, title: string, categories: Array<{title: string, text: string, inline: boolean}>, color: number, image: string, description: string, thumbnail: string, url: string, buttons: {}}} param0
 * @return {Promise<Discord.Message>}
 */
async function sendRichTextDefaultExplicit({
  guild,
  channel,
  author,
  title,
  categories,
  color,
  image,
  description,
  thumbnail,
  url,
  buttons,
}) {
  return await sendRichTextExplicit(guild, channel, author, title, categories, color, image, description, thumbnail, url, buttons);
}

/**
 * Prints a Message Embed
 * @param {Discord.Guild} guild the Guild to print to
 * @param {Discord.TextChannel} channel the channel to print to
 * @param {Discord.UserResolvable} author the author of the message
 * @param {string} title the title
 * @param {Array<{title: string, text: string, inline: boolean}>} categories the fields
 * @param {number} color hex rgb color
 * @param {string} image an image path
 * @param {string} description
 * @param {string} thumbnail thumbnail url string
 * @param {string} url an url
 * @param {*} buttons
 * @return {Promise<Discord.Message>}
 */
async function sendRichTextExplicit(guild, channel, author, title, categories, color, image, description, thumbnail, url, buttons) {
  channel.sendTyping();
  const richText = new Discord.MessageEmbed();
  if (title) {
    richText.setTitle(title);
  }

  if (categories) {
    categories.forEach((category) => {
      if (category.title) {
        richText.addField(category.title, category.text || '\u200b', category.inline || false);
      } else {
        richText.addBlankField(category.inline || false);
      }
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
  if (image) {
    richText.attachFiles([`./src/assets/${image}`]);
    richText.setImage(`attachment://${image}`);
  }

  if (guild && author) {
    const guildMember = await guild.members.fetch(author);
    richText.setFooter(guildMember.nickname?guildMember.nickname.toString():guildMember.user.username.toString(), author.avatarURL());
  }

  richText.setTimestamp(new Date());
  if (url) {
    richText.setURL(url);
  }

  if (buttons) {
    return channel.send({embeds: [richText], components: [buttons]});
  }
  return channel.send({embeds: [richText]});
}

/**
 * Returns a Message Embed
 * @param {{guild: Discord.Guild, channel: Discord.TextChannel, title: string, categories: Array<{title: string, text: string, inline: boolean}>, color: number, image: string, description: string, thumbnail: string, url: string, buttons: {}}} param0
 * @return {Promise<Discord.Message>}
 */
async function getRichTextExplicitDefault({
  guild,
  author,
  title,
  categories,
  color,
  image,
  description,
  thumbnail,
  url,
  buttons,
}) {
  return getRichTextExplicit(guild, author, title, categories, color, image, description, thumbnail, url, buttons);
}

async function getRichTextExplicit(guild, author, title, categories, color, image, description, thumbnail, url, buttons) {
  const richText = new Discord.MessageEmbed();
  if (title) {
    richText.setTitle(title);
  }

  if (categories) {
    categories.forEach((category) => {
      if (category.title) {
        richText.addField(category.title, category.text || '\u200b', category.inline || false);
      } else {
        richText.addBlankField(category.inline || false);
      }
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
  if (image) {
    richText.attachFiles([`./src/assets/${image}`]);
    richText.setImage(`attachment://${image}`);
  }

  if (guild && author) {
    const guildMember = await guild.members.fetch(author);
    richText.setFooter(guildMember.nickname?guildMember.nickname.toString():guildMember.user.username.toString(), author.avatarURL());
  }

  richText.setTimestamp(new Date());
  if (url) {
    richText.setURL(url.toString());
  }

  let returnValue = {embeds: [richText]};

  if (buttons) {
    returnValue = {embeds: [richText], components: [buttons]};
  }
  return returnValue;
}

/**
 * Prints a MessageEmbed
 * @param {Discord.Message} msg the message object to print from
 * @param {string} title
 * @param {{title: string, text: string, inline: boolean}} categories the fields to add
 * @param {number} color hex rgb number
 * @param {string} image image path
 * @param {string} description
 * @param {string} thumbnail thumbnail url
 * @param {url} url
 * @param {*} buttons
 * @return {Promise<Discord.Message>}
 */
async function sendRichText(msg, title, categories, color, image, description, thumbnail, url, buttons) {
  return await sendRichTextExplicit(msg.guild, msg.channel, msg.author,
      title, categories, color, image, description, thumbnail, url, buttons);
}

export default {
  sendRichText,
  sendRichTextExplicit,
  sendRichTextDefault,
  sendRichTextDefaultExplicit,
  getRichTextExplicit,
  getRichTextExplicitDefault,
};
