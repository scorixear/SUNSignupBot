import fs from 'fs';
import config from '../config.js';

export let dic = JSON.parse(fs.readFileSync(`./src/assets/en_EN.json`));

/**
 * Changes the language to the given language unicode
 * @param {string} lang
 * @return {bool} False if File did not exist
 */
export function changeLanguage(lang) {
  if (!fs.existsSync(`./src/assets/language/${lang}.json`)) {
    return false;
  } else {
    dic = JSON.parse(fs.readFileSync(`./src/assets/language/${lang}.json`));
    config.language = lang;
    fs.writeFileSync('./src/config.json', JSON.stringify(config, null, 2));
    languageTag = lang;
    return true;
  }
}

/**
 * Replaces preset args with values in a string
 * @param {string} input
 * @param {Array.<string>} args
 * @return {string} the filled string
 */
export function replaceArgs(input, args) {
  // console.log(input);
  // console.log(args);
  for (let i = 0; i<args.length; i++) {
    input = input.split('$'+i).join(args[i]);
  }
  return input;
}
