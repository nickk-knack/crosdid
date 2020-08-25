const { MessageEmbed } = require('discord.js');
const querystring = require('querystring');
const fetch = require('node-fetch');
const randomHex = require('random-hex');
const { addFieldIfNotEmpty } = require('../util');

module.exports = {
  name: 'e621',
  aliases: ['e6'],
  description: 'Search e621',
  args: true,
  usage: '<tags>',
  guildOnly: false,
  cooldown: 5,
  async execute(message, args) {
    const searchTerms = args.join(' ');
    const length = 10;

    const opts = {
      method: 'GET',
      headers: {
        'User-Agent': 'crosdid/1.0',
      },
    };

    const query = querystring.stringify({
      tags: searchTerms,
      limit: length,
    }).replace(/%20/gu, '+');

    try {
      const response = await fetch(`https://e621.net/posts.json?${query}`, opts);

      if (!response.ok) {
        throw new Error(`Server responded [${response.status}]: ${response.statusText}`);
      }

      const json = await response.json();
      const { posts } = json;

      if (typeof posts === 'undefined') {
        return message.reply('the posts object was undefined for your search. what the fuck?');
      }

      if (!posts.length) {
        return message.reply(`no results were found for \`${searchTerms}\``);
      }

      const result = posts[Math.floor(Math.random() * posts.length)];

      const embed = new MessageEmbed()
        .setColor(randomHex.generate())
        .setTitle(args.map((e) => `"${e}"`).join(' + '))
        .setDescription(result.description)
        .setImage(result.file.url)
        .setThumbnail(result.preview.url)
        .setURL(`https://e621.net/posts/${result.id}?q=${query}`)
        .setAuthor(result.tags.artist.join(', '))
        .setTimestamp(new Date(result.updated_at))
        .setFooter(`score: ${result.score.total}`);

      addFieldIfNotEmpty(embed, 'General tags', result.tags.general.join(', '), false);
      addFieldIfNotEmpty(embed, 'Species tags', result.tags.species.join(', '), true);
      addFieldIfNotEmpty(embed, 'Character tags', result.tags.character.join(', '), true);
      addFieldIfNotEmpty(embed, 'Copyright tags', result.tags.copyright.join(', '), true);
      addFieldIfNotEmpty(embed, 'Lore tags', result.tags.lore.join(', '), true);
      addFieldIfNotEmpty(embed, 'Meta tags', result.tags.meta.join(', '), true);

      await message.channel.send(embed);
    } catch (err) {
      throw new Error(`An error occurred while performing the request to the API: ${err}`);
    }
  },
};
