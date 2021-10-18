import Fs from 'fs';

function registerInteractions() {
  const interactions = Fs.readdirSync('./src/interactions');
  interactions.forEach((file)=> {
    if (file.endsWith('js')) {
      Reflect.construct(require('./../interactions/'+file).default, []);
    }
  });
}

export default {registerInteractions};
