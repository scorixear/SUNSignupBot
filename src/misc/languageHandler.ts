import fs from 'fs';

export class LanguageHandler {
  public language: {[key: string]: any};
  constructor() {
    this.language = JSON.parse(fs.readFileSync(`./src/assets/en_EN.json`).toString());
  }

  /**
 * Replaces preset args with values in a string
 * @param input
 * @param args
 * @return the filled string
 */
  public replaceArgs(input: string, args: string[]) {
    // console.log(input);
    // console.log(args);
    for (let i = 0; i<args.length; i++) {
      input = input.split('$'+i).join(args[i]);
    }
    return input;
  }
}
