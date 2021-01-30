const { MessageEmbed } = require('discord.js');
// eslint-disable-next-line camelcase
const { image_search } = require('duckduckgo-images-api');
const randomHex = require('random-hex');

module.exports = {
  name: 'image',
  aliases: ['i'],
  description: 'Search Google Images for your query.',
  args: true,
  usage: '<search query>',
  guildOnly: false,
  cooldown: 3,
  async execute(message, args) {
    const query = args.join(' ').trim();

    try {
      const images = await image_search({
        query: query,
        iterations: 1,
        retries: 3,
      });

      // Check if there were no results
      if (!images.length) return message.reply(`no results found for \`${query}\``);

      // Get random image
      const randomImage = images[Math.floor(Math.random() * images.length)];
      // This check is technically legacy shit, but I'm going to leave it in "just in case"
      if (typeof randomImage === 'undefined') return message.reply(`no results found for \`${query}\``);

      const embed = new MessageEmbed()
        .setColor(randomHex.generate())
        .setTitle(`"${query}"`)
        .setImage(randomImage.image);

      await message.channel.send(embed);
    } catch (e) {
      throw new Error(`An error occurred requesting your image (code: ${e.statusCode}). [${e.message}]`);
    }
  },
};
