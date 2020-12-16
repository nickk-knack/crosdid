const { MessageEmbed } = require('discord.js');
const querystring = require('querystring');
const randomHex = require('random-hex');
const fetch = require('node-fetch');
const parser = require('xml2js').parseStringPromise;

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
      const postObject = post[Math.floor(Math.random() * post.length)].$;
      const embed = new MessageEmbed()
        .setColor(randomHex.generate())
        .setTitle(args.map((e) => `"${e}"`).join(' + '))
        .setImage(postObject.file_url)
        .setTimestamp(postObject.created_at)
        .setFooter(`score: ${postObject.score}`)
        .addField('Tags', postObject.tags);

      await message.channel.send(embed);
    } catch (e) {
      throw new Error(`Something went wrong while making the request. (\`${e.message}\`)`);
    }
  },
};
