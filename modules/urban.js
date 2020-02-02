const Discord = require('discord.js');
const randomHex = require('random-hex');
const fetch = require('node-fetch');
const trim = (str, max) => (str.length > max) ? `${str.slice(0, max - 3)}...` : str;

// Todo: Rewrite to use node-fetch (I want to purge snekfetch)

module.exports = {
  name: 'urban',
  aliases: ['ud', 'urband'],
  description: 'Searches urbandictionary.com for a phrase and returns the closest listing.',
  usage: '<search>',
  args: true,
  guildOnly: false,
  cooldown: 5,
  async execute(message, args) {
    fetch(`https://api.urbandictionary.com/v0/define?term=${args.join('%20')}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.list.length) {
          return message.channel.send(`No results found for **${args.join(' ')}**`);
        }

        const answer = json.list[Math.floor(Math.random() * json.list.length)];

        const embed = new Discord.RichEmbed()
          .setColor(randomHex.generate())
          .setTitle(answer.word)
          .setURL(answer.permalink)
          .setAuthor(answer.author)
          .setTimestamp(answer.written_on)
          .addField('Definition', trim(answer.definition, 1024))
          .addField('Example', trim(answer.example, 1024))
          .addField('Rating', `${answer.thumbs_up} thumbs up.\n${answer.thumbs_down} thumbs down.`);

        message.channel.send(embed);
      })
      .catch((err) => {
        console.error(err);
        message.reply('an error occurred while querying the API!');
      });
  },
};
