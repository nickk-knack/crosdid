const Discord = require('discord.js');
const fetch = require('node-fetch');
const randomHex = require('random-hex');
const trim = (str, max) => (str.length > max) ? `${str.slice(0, max - 3)}...` : str;
const sortTypes = ['relevance', 'hot', 'top', 'new', 'comments'];

module.exports = {
  name: 'reddit',
  aliases: ['r'],
  description: 'Searches reddit (optionally, a specific subreddit) for your query and returns the first post relating to your search term (optionally sorted by a provided sorting type).',
  usage: '[-s, --sub (subreddit)] [--sort relevance | top | new | comments] <search query>',
  args: true,
  guildOnly: false,
  cooldown: 5,
  async execute(message, args) {
    // Get options and search query from args
    const subredditFlagIndex = args.findIndex((val) => /^-s$|^--sub$/giu.test(val));
    let subreddit = '';
    if (subredditFlagIndex > -1) {
      args.splice(subredditFlagIndex, 1);
      subreddit = args.splice(subredditFlagIndex, 1);
    }

    const sortTypeFlagIndex = args.findIndex((val) => /^--sort$/giu.test(val));
    let sortType = 'hot';
    if (sortTypeFlagIndex > -1) {
      args.splice(sortTypeFlagIndex, 1);
      sortType = args.splice(sortTypeFlagIndex, 1);

      if (!sortTypes.includes(sortType)) sortType = 'hot';
    }

    const search = args.join(' ');
    if (search.length > 512) {
      return message.reply('Your search query is too long!');
    }

    // Put together data
    const url = `https://www.reddit.com/${subreddit !== '' ? `r/subreddit/${subreddit}` : ''}search.json`;
    const query = `?q=${search}&sort=${sortType}&limit=1&restrict_sr=false`;

    fetch(`${url}${query}`)
      .then((res) => res.json())
      .then((data) => data.data.children.map((d) => d.data))
      .then((results) => {
        const [result] = results;

        const embed = new Discord.RichEmbed()
          .setTitle(`${result.subreddit_name_prefixed} - ${trim(result.title, 253 - result.subreddit_name_prefixed.length)}`)
          .setDescription(result.selftext !== '' ? result.selftext : `[permalink](https://reddit.com${result.permalink})`)
          .setURL(result.selftext !== '' ? result.url : `https://reddit.com${result.permalink}`)
          .setThumbnail(/^https?:\/\/[^\s$.?#].[^\s]*$/gmu.test(result.thumbnail) ? result.thumbnail : '')
          .setAuthor(result.author, '', `https://reddit.com/u/${result.author}`)
          .setColor(randomHex.generate())
          .setTimestamp(new Date(result.created_utc * 1000))
          .setFooter(`${result.ups} points`);

        message.channel.send(embed).catch(console.error);
      })
      .catch((err) => {
        console.error(err);
        return message.reply('There was an error while querying the reddit API!');
      });
  },
};
