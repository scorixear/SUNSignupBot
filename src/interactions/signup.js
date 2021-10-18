import buttonActionHandler from '../misc/buttonActionHandler';
import {ButtonInteraction} from 'discord.js';
import messageHandler from '../misc/messageHandler';


export default class Interaction {
  constructor() {
    buttonActionHandler.addButtonAction(/signup/g, signup);
    buttonActionHandler.addButtonAction(/signout/g, signout);
  }
}

/**
   *
   * @param {ButtonInteraction} interaction
   */
async function signup(interaction) {
  const channel = await interaction.member.createDM();
  const messageEmbed = await messageHandler.getRichTextExplicitDefault({
    guild: interaction.guild,
    title: 'Signup Title',
    color: 0x00cc00,
    description: 'Signup description',
  });
  console.log(messageEmbed);
  channel.send(messageEmbed);
}

/**
 *
 * @param {ButtonInteraction} interaction
 */
function signout(interaction) {

}

