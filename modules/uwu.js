module.exports = {
  name: 'uwu',
  aliases: [],
  description: 'Gives whatevwe you type cancew OwO',
  usage: '<text>',
  guildOnly: false,
  args: true,
  cooldown: 3,
  execute(message, args) {
    const original = args.join(' ').trim();

    // maybe just convert whole thing to lower
    // or maybe rewrite to preserve case tho?

    let uwu = original.replace(/r/giu, 'w');
    uwu = uwu.replace(/l/giu, 'w');

    // add a case for first instance of a word that starts with Th (ignore case)
    uwu = uwu.replace(/you/giu, 'yuw');
    uwu = uwu.replace(/\sth/giu, ' d');
    uwu = uwu.replace(/th/giu, 'f');
    message.channel.send(`${uwu} uwu`);
  },
};
