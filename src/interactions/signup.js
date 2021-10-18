import buttonActionHandler from '../misc/buttonActionHandler';
import {ButtonInteraction} from 'discord.js';


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
function signup(interaction) {

}

/**
 *
 * @param {ButtonInteraction} interaction
 */
function signout(interaction) {

}

