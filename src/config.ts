import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./src/config.json').toString());
config.version = JSON.parse(fs.readFileSync('package.json').toString()).version;

export default config;