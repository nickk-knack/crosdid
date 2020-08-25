const { MessageEmbed } = require('discord.js');
const { trim } = require('../util');
const randomHex = require('random-hex');
const wiki = require('wikijs').default();

module.exports = {
  name: 'wikipedia',
  aliases: ['wiki', 'wp'],
  description: 'Search wikipedia for a page. Use `-r` for a random article, OR choose from `-l <number>`/`--limit <number>` to allow for more articles to choose from (default is 1), and `-m`/`--more` to get more information about your search.',
  usage: '<-r> | <query> [-l, --limit <number>]',
  args: true,
  guildOnly: false,
  cooldown: 5,
  async execute(message, args) {
    let search = null;
    let searchResult = null;
    let query = '';

    if (args[0] === '-r') {
      query = 'Random';

      try {
        search = await wiki.random(5);
        searchResult = search[Math.floor(Math.random() * search.length)];
      } catch (err) {
        throw new Error(`Could not get a random page! Something is fucky. (${err})`);
      }
    } else {
      // Get "limit" flag and new "limit"
      let limit = 1;
      const limitFlagIndex = args.findIndex((val) => val === '-l' || val === '--limit');
      const limitEnabled = limitFlagIndex > -1;
      if (limitEnabled) {
        // Remove the flag from the args
        args.splice(limitFlagIndex, 1);

        // The item now at the flag index *should* be a number containing the actual limit
        const parsedLimit = parseInt(args[limitFlagIndex], 10);
        if (isNaN(parsedLimit)) return message.reply(`${args[limitFlagIndex]} is not a valid limit!`);

        // It passes, set the limit and splice the argument out
        limit = parsedLimit;
        args.splice(limitFlagIndex, 1);
      }

      query = args.join(' ');

      // Search query, get top result, print out the full url to that wikipedia page
      try {
        search = await wiki.search(query, limit);
        if (!search.results.length) {
          return message.reply(`no results found for '${search.query}'`);
        }

        searchResult = search.results[Math.floor(Math.random() * search.results.length)];
      } catch (err) {
        throw new Error(`An error occurred while processing that request! (${err})`);
      }
    }

    // With page result, build embed and send
    try {
      // there is a rate limiting issue here or some shit idk really
      const pageResult = await wiki.page(searchResult);
      const summary = await pageResult.summary();
      await new Promise((r) => setTimeout(r, 3000));
      const mainImage = await pageResult.mainImage();
      // await new Promise((r) => setTimeout(r, 2000));
      // const images = await pageResult.images();
      // const validImages = images.filter((i) => /.*\.(?:svg|jpg|jpeg|png|gif)$/giu.test(i));
      // const randomImage = validImages[Math.floor(Math.random() * validImages.length)];

      const embed = new MessageEmbed()
        .setColor(randomHex.generate())
        .setTitle(`"**${pageResult.raw.title}**"`)
        .setURL(pageResult.raw.fullurl)
        .setTimestamp(pageResult.raw.touched)
        .setFooter(`Query: "${query}"`)
        .setImage(mainImage)
        .setDescription(trim(summary, 2048));
        // .setThumbnail(randomImage);

      await message.channel.send(embed);
    } catch (err) {
      throw new Error(`An error occurred while building the embed... (${err})`);
    }
  },
};
