import discordHandler from './discordHandler';

// list of registered buttons and their custom id match
const buttons = new Map();

/**
 * adds a button to the list of buttons
 * @param {*} regex
 * @param {*} action
 */
function addButtonAction(regex, action) {
  buttons.set(regex, action);
}

/**
 * Called on Bot start, initializes a map between buttons and their provided function handlers
 */
function initialize() {
  // On Interaction created (such as slash commands, Buttons etc.)
  discordHandler.client.on('interactionCreate', async (interaction) => {
    // if interaction isn't a button  | potential change for Dropdowns
    if (!interaction.isButton()) return;

    // search map for the key which contains the regex that matches the given customId
    const key = searchMapKey(buttons, (k)=> interaction.customId.match(k));

    // if key ways found
    if (key) {
      // call provided function handler - will run asynchronously
      buttons.get(key).call(undefined, interaction);
      // set interaction as handled
      interaction.deferUpdate();
    }
  });
}

/**
 * Searches the Map and return the first match for the given searchAction function
 * @param {Map} map
 * @param {Function<bool>} searchAction
 * @return {string}
 */
function searchMapKey(map, searchAction) {
  for (const [key, value] of map.entries()) {
    if (searchAction(key)) {
      return key;
    }
  }
  return undefined;
}

export default {addButtonAction, initialize};
