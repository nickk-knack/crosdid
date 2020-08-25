const { MessageEmbed } = require('discord.js');
const querystring = require('querystring');
const fetch = require('node-fetch');
const randomHex = require('random-hex');
const { trim } = require('../util');
const sortTypes = ['relevance', 'hot', 'top', 'new', 'comments'];
const thumbRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/gmiu;
const domainRegex = /(?:i\.)?(?:imgur|redd|gfy|giphy)/giu;

module.exports = {
  name: 'reddit',
  aliases: ['r'],
  description: 'Searches reddit (optionally, a specific subreddit) for your query and returns the first post relating to your search term (optionally sorted by a provided sorting type). A limit of 10 posts per search is default, but can be set to any number between 1 and 100 with the -l, --limit flag.',
  usage: '[-s, --sub (subreddit)] [--sort relevance | top | new | comments] [-l, --limit (1..100, def: 10)] <search query>',
  args: true,
  guildOnly: false,
  cooldown: 5,
  async execute(message, args) {
    // Get options and search query from args
    const subredditFlagIndex = args.findIndex((val) => /^-s$|^--sub$/giu.test(val));
    let subreddit = '';
    if (subredditFlagIndex > -1) {
      args.splice(subredditFlagIndex, 1);
      subreddit = args.splice(subredditFlagIndex, 1)[0].toLowerCase();
    }

    const sortTypeFlagIndex = args.findIndex((val) => /^--sort$/giu.test(val));
    let sortType = 'hot';
    if (sortTypeFlagIndex > -1) {
      args.splice(sortTypeFlagIndex, 1);
      sortType = args.splice(sortTypeFlagIndex, 1)[0].toLowerCase();

      if (!sortTypes.includes(sortType)) sortType = 'hot';
    }

    const search = args.join(' ');
    if (search.length > 512) {
      return message.reply('your search query is too long!');
    }

    // Get "limit" flag and new "limit"
    let limit = 10;
    const limitFlagIndex = args.findIndex((val) => /^-l$|^--limit$/giu.test(val));
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

    // Put together data
    const url = `https://www.reddit.com/${subreddit !== '' ? `r/${subreddit}/` : ''}search.json`;
    const query = querystring.stringify({
      q: search,
      sort: sortType,
      limit: limit,
      restrict_sr: false,
      raw_json: 1,
    });

    // Perform request, return data
    try {
      const response = await fetch(`${url}?${query}`);
      const json = await response.json();
      const results = json.data.children.map((d) => d.data);

      if (!results.length) return message.reply(`there were no results found for ${search}!`);

      const [result] = results;

      const embed = new MessageEmbed()
        .setTitle(`${result.subreddit_name_prefixed} - ${trim(result.title, 253 - result.subreddit_name_prefixed.length)}`)
        .setDescription(result.is_self ? trim(result.selftext, 2048) : `[permalink](https://reddit.com${result.permalink})`)
        .setURL(result.is_self ? `https://reddit.com${result.permalink}` : result.url)
        .setAuthor(result.author, '', `https://reddit.com/u/${result.author}`)
        .setColor(randomHex.generate())
        .setTimestamp(new Date(result.created_utc * 1000))
        .setFooter(`${result.score} points`);

      // Set image/thumbnail separately, don't want duplicate images in the embed
      if (domainRegex.test(result.domain)) {
        embed.setImage(result.url);
      } else {
        embed.setThumbnail(thumbRegex.test(result.thumbnail) ? result.thumbnail : '');
      }

      message.channel.send(embed);
    } catch (err) {
      throw new Error(`There was an error while querying the reddit API! (${err})`);
    }
  },
};
