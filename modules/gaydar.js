const { hashString, normalizeHash } = require('../util');

module.exports = {
  name: 'gaydar',
  aliases: ['gay'],
  description: 'Enable the bot\'s gaydar to check and see if something is gay.',
  usage: '<noun>',
  args: true,
  execute(message, args) {
    const name = args.join(' ');

    const nameHash = hashString(name);
    const normalizedVal = normalizeHash(nameHash);
    const gay = (normalizedVal >= 0.85);

    message.reply(`${name} is ${gay ? 'totally' : 'not'} gay.`);
  },
};
