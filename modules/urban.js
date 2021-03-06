const { MessageEmbed } = require('discord.js');
const querystring = require('querystring');
const randomHex = require('random-hex');
const fetch = require('node-fetch');
const { trim } = require('../util');

module.exports = {
  name: 'urban',
  aliases: ['ud', 'urband'],
  description: 'Searches urbandictionary.com for a phrase and returns the closest listing.',
  usage: '<search>',
  args: true,
  guildOnly: false,
  cooldown: 5,
  async execute(message, args) {
    const query = querystring.stringify({ term: args.join(' ') });

    try {
      const response = await fetch(`http://api.urbandictionary.com/v0/define?${query}`);
      const json = await response.json();
      if (!json.list.length) {
        return message.channel.send(`No results found for **${args.join(' ')}**`);
      }

      const answer = json.list[Math.floor(Math.random() * json.list.length)];

      const embed = new MessageEmbed()
        .setColor(randomHex.generate())
        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/UD_logo-01.svg/512px-UD_logo-01.svg.png')
        .setTitle(answer.word)
        .setURL(answer.permalink)
        .setAuthor(answer.author)
        .setTimestamp(answer.written_on)
        .addField('Definition', trim(answer.definition, 1024))
        .addField('Example', trim(answer.example, 1024))
        .addField('Rating', `${answer.thumbs_up} thumbs up.\n${answer.thumbs_down} thumbs down.`);

      await message.channel.send(embed);
    } catch (e) {
      throw new Error(`An error occurred while querying the API! (${e.message})`);
    }
  },
};
