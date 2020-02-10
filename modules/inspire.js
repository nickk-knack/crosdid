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
  cooldown: 5,
  async execute(message, args) {
    fetch(`http://inspirobot.me/api?generate=true${args.length && args[0] === 'xmas' ? '&season=xmas' : ''}`)
      .then((res) => res.text())
      .then((data) => {
        const embed = new Discord.RichEmbed()
          .setColor(randomHex.generate())
          .setImage(data);

        message.channel.send(embed).catch(console.error);
      })
      .catch((err) => {
        console.error(err);
        message.reply(`I had trouble getting inspired... (${err.message})`);
      });
  },
};
