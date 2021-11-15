import config from '../config';
import {DMChannel, MessageActionRow, MessageButton, TextBasedChannels, Message, ButtonInteraction} from 'discord.js';
import messageHandler from '../misc/messageHandler';
import { LanguageHandler } from '../misc/languageHandler';
import signup from './signup';
import User from '../model/user';

declare const languageHandler: LanguageHandler;


/**
 * Sends a confirmation Message requesting the confirmation of the given data
 */
async function sendConfirmationMessage(event: string, channel: TextBasedChannels, player: User, interaction?: ButtonInteraction) {
  const row = new MessageActionRow()
      .addComponents(
          new MessageButton()
              .setCustomId(interactionHandler.buttonInteractions.typeGet(signup.SignupConfirmation)+event)
              .setLabel('Confirm')
              .setStyle('SUCCESS'),
          new MessageButton()
              .setCustomId(interactionHandler.buttonInteractions.typeGet(signup.SignupEditEvent)+event)
              .setLabel('Edit')
              .setStyle('DANGER'),
      );
  try {
    await channel.send(await messageHandler.getRichTextExplicitDefault({
      title: languageHandler.language.interactions.signup.confirmation.title,
      description: languageHandler.language.interactions.signup.confirmation.desc,
      categories: [
        {
          title: languageHandler.language.interactions.signup.confirmation.name,
          text: player.name,
          inline: true,
        },
        {
          title: languageHandler.language.interactions.signup.confirmation.weapon1,
          text: player.weapon1,
          inline: true,
        },
        {
          title: languageHandler.language.interactions.signup.confirmation.weapon2,
          text: player.weapon2,
          inline: true,
        },
        {
          title: languageHandler.language.interactions.signup.confirmation.role,
          text: player.role,
          inline: true,
        },
        {
          title: languageHandler.language.interactions.signup.confirmation.guild,
          text: player.guild,
          inline: true,
        },
        {
          title: languageHandler.language.interactions.signup.confirmation.level,
          text: player.level.toString(),
          inline: true,
        },
        {
          title: languageHandler.language.interactions.signup.confirmation.gearscore,
          text: player.gearscore.toString(),
          inline: true,
        },
      ],
      components: [row],
    }));
  }
  catch (err) {
    if(interaction) {
      console.error('Error sending DM', err);
      interaction.followUp({content: languageHandler.replaceArgs(languageHandler.language.interactions.signup.error.dmChannel, [interaction.member.user.id]), ephemeral: true});
    }
  }
}

export default {
  sendConfirmationMessage,
};
