const Discord = require('discord.js');
const randomHex = require('random-hex');
const fetch = require('node-fetch');

module.exports = {
  name: 'inspire',
  aliases: [],
  description: 'Generates an inspiring quote and image from http://inspirobot.me',
  usage: '[xmas]',
  args: false,
  guildOnly: false,
  cooldown: 7,
  execute(message, args) {
    let season = '';
    if (args.length && args[0] == 'xmas') {
      season = '&season=xmas';
    }

    fetch(`http://inspirobot.me/api?generate=true${season}`)
      .then((res) => res.text())
      .then((data) => {
        const embed = new Discord.RichEmbed()
          .setColor(randomHex.generate())
          .setImage(data);

        message.channel.send(embed);
      });
  },
};
