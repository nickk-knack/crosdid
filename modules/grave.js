const { MessageAttachment } = require('discord.js');
const randomHex = require('random-hex');
const fetch = require('node-fetch');

module.exports = {
  name: 'grave',
  description: '',
  usage: '<"Line 1"> ["Line 2"] ["Line 3"] ["Line 4"]',
  args: true,
  guildOnly: false,
  cooldown: 5,
  execute(message, args) {
    const reparsedArgs = args.join(' ').split('"').filter((val) => !/^\s?$/giu.test(val));
    let url = `http://www.tombstonebuilder.com/generate.php?top1=${reparsedArgs.shift().replace(/\s+/giu, '+')}`;

    let curLine = 1;
    while (reparsedArgs.length) url += `&top${++curLine}=${reparsedArgs.shift().replace(/\s+/giu, '+')}`;
    url += '&sp=';

    fetch(url)
      .then((res) => res.buffer())
      .then((buf) => {
        const attachment = new MessageAttachment(buf, 'gravestone.png');

        message.channel.send({
          files: [attachment],
          embed: {
            image: {
              url: 'attachment://gravestone.png',
            },
            color: parseInt(randomHex.generate(), 16),
          },
        }).catch(console.error);
      })
      .catch((err) => {
        console.error(err);
        message.reply(`an error occurred while fetching that gravestone: \`${err.message}\``);
      });
  },
};
