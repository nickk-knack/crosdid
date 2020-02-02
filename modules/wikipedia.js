const Discord = require('discord.js');
const randomHex = require('random-hex');
const wiki = require('wikijs').default();

// Currently, errors are being thrown during calls to page.mainImage(), summary(), and images()
// It also fails on references and coordinates when passed the `more` flag
// What's extra weird is those don't normally fail, and clicking on the links in the error message seems to give valid output
// Likely rate limiting
const buildEmbed = (query, page, more) => {
  const embed = new Discord.RichEmbed()
    .setColor(randomHex.generate())
    .setTitle(`"**${page.raw.title}**"`)
    .setURL(page.raw.fullurl)
    .setTimestamp(page.raw.touched)
    .setFooter(`Query: "${query}"`);

  page.mainImage().then(embed.setThumbnail).catch(console.error);
  page.summary().then((s) => embed.setDescription(s.length > 2048 ? s.substring(0, 2044).concat('...') : s)).catch(console.error);

  // page.images().then((images) => {
  // 	const valid = images.filter((i) => /.*\.(svg|jpg|jpeg|png|gif)$/giu.test(i));

  // 	embed.setImage(valid[Math.floor(Math.random() * valid.length)]);
  // }).catch(console.error);

  if (more) {
    page.references().then((r) => embed.addField('Number of references', r.length)).catch(console.error);
    page.coordinates().then((c) => embed.addField('Coordinates', !c.error ? `lat: ${c.lat}\nlon: ${c.lon}` : `An error occurred: ${c.error}`)).catch(console.error);
  }

  return embed;
};

module.exports = {
  name: 'wikipedia',
  aliases: ['wiki', 'wp'],
  description: 'Search wikipedia for a page. Use `-r` for a random article, OR choose from `-l <number>`/`--limit <number>` to allow for more articles to choose from (default is 1), and `-m`/`--more` to get more information about your search.',
  usage: '<-r> | [-l, --limit <number>] [-m, --more] <query>',
  args: true,
  guildOnly: false,
  cooldown: 5,
  execute(message, args) {
    if (args[0] === '-r') {
      wiki.random(5)
        .then((res) => {
          const item = Math.floor(Math.random() * res.length);

          wiki.page(res[item])
            .then((p) => {
              message.channel.send(buildEmbed('Random', p, false));
            })
            .catch((err) => {
              console.error(err);
              message.reply('could not get a random page! Something is fucky.');
            });
        })
        .catch((err) => {
          console.error(err);
          message.reply('an error occurred while processing that request!');
        });

      return;
    }

    // Get "more info" flag
    const moreInfoFlagIndex = args.findIndex((val) => val === '-m' || val === '--more');
    const moreInfo = moreInfoFlagIndex !== -1;
    if (moreInfo) args.splice(moreInfoFlagIndex, 1);

    // Get "limit" flag and new "limit"
    let limit = 1;
    const limitFlagIndex = args.findIndex((val) => val === '-l' || val === '--limit');
    const limitEnabled = limitFlagIndex !== -1;
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

    const query = args.join(' ');

    // Search query, get top result, print out the full url to that wikipedia page
    wiki.search(query, limit)
      .then((res) => {
        const [result] = res.results;

        wiki.page(result)
          .then((p) => {
            message.channel.send(buildEmbed(query, p, moreInfo));
          })
          .catch((err) => {
            console.error(err);
            message.reply(`no results found for '${query}'`);
          });
      })
      .catch((err) => {
        console.error(err);
        message.reply('an error occurred while processing that request!');
      });
  },
};
