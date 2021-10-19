import buttonActionHandler from '../misc/buttonActionHandler';
import {ButtonInteraction} from 'discord.js';
import messageHandler from '../misc/messageHandler';
import googleSheetsHandler from '../misc/googleSheetsHandler';
import config from '../config';


export default class Interaction {
  constructor() {
    buttonActionHandler.addButtonAction(/signup-1/g, signup);
    buttonActionHandler.addButtonAction(/signout-1/g, signout);
  }
}

/**
   *
   * @param {ButtonInteraction} interaction
   */
async function signup(interaction) {
  const channel = await interaction.member.createDM();

  const data = await googleSheetsHandler.retrieveData(config.googleSheetsId, 'Players!A2:G');
  const players = data.values;
  if (players.find((subarray) => subarray[1] === interaction.member.user.id)) {
    // TOOD: check if player has already signed up
    // TODO: Send Message with confirmation of values
  } else {
    // TODO: Send Message with registering of values
  }
  const messageEmbed = await messageHandler.getRichTextExplicitDefault({
    guild: interaction.guild,
    title: 'Signup Title',
    color: 0x00cc00,
    description: 'Signup description',
  });
  channel.send(messageEmbed);
}

/**
 *
 * @param {ButtonInteraction} interaction
 */
async function signout(interaction) {
  const channel = await interaction.member.createDM();
  const data = await googleSheetsHandler.retrieveData(config.googleSheetsId, 'Players!A2:G');
  const players = data.values;
  if (players.find((subarray) => subarray[1] === interaction.member.user.id)) {
    // TODO: check if player has signed up
  } else {
    // TODO: Send Message with confirmation of signout
  }
}

