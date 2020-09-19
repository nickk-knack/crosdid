const { MessageEmbed } = require('discord.js');
const querystring = require('querystring');
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
    try {
      const qObj = { generate: true };
      if (args.length && args[0] === 'xmas') qObj.season = 'xmas';

      const query = querystring.stringify(qObj);
      const response = await fetch(`http://inspirobot.me/api?${query}`);
      const data = await response.text();
      const embed = new MessageEmbed()
        .setColor(randomHex.generate())
        .setImage(data);

      await message.channel.send(embed);
    } catch (e) {
      throw new Error(`I had trouble getting inspired... (${e.message})`);
    }
  },
};
