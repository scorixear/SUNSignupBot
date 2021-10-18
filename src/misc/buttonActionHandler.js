import discordHandler from './discordHandler';

const buttons = new Map();

function addButtonAction(regex, action) {
  buttons.set(regex, action);
}

function initialize() {
  discordHandler.client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const key = searchMapKey(buttons, (k)=> interaction.customId.match(k));
    if (key) {
      buttons.get(key).call(interaction);
    }
  });
}


function searchMapKey(map, searchAction) {
  for (const [key, value] of map.entries()) {
    if (searchAction(key)) {
      return key;
    }
  }
  return undefined;
}

export default {addButtonAction, initialize};
