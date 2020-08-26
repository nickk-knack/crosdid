const { MessageEmbed } = require('discord.js');
const querystring = require('querystring');
const randomHex = require('random-hex');
const fetch = require('node-fetch');
const parser = require('xml2js').parseStringPromise;

// Todo: Rewrite to use node-fetch, fetch raw image data
// and put it in a rich embed
// Look at the groupme bot version

module.exports = {
  name: 'r34',
  aliases: ['rule34'],
  description: 'Searches rule34.xxx for whatever tags you request.',
  usage: '<search tags>',
  guildOnly: false,
  cooldown: 5,
  async execute(message, args) {
    const limit = 20;
    const searchTerms = args.join('+');

    const query = querystring.stringify({
      page: 'dapi',
      s: 'post',
      q: 'index',
      tags: searchTerms,
      limit: limit,
    });

    try {
      const response = await fetch(`https://rule34.xxx/index.php?${query}`);
      const body = await response.text();
      const result = await parser(body.toString('utf8'));
      const json = JSON.parse(JSON.stringify(result));
      if (json.posts.$.count === '0') return message.channel.send(`No results found for **${searchTerms}**`);

      const { post } = json.posts;
      const fileUrl = post[Math.floor(Math.random() * post.length)].$.file_url;
      const embed = new MessageEmbed()
        .setColor(randomHex.generate())
        .setTitle(args.join(' '))
        .setImage(fileUrl);

      await message.channel.send(embed);
    } catch (err) {
      throw new Error(`Something went wrong while making the request. (\`${err}\`)`);
    }
  },
};
