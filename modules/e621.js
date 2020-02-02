const Discord = require('discord.js');
const fetch = require('node-fetch');
const randomHex = require('random-hex');

module.exports = {
  name: 'e621',
  description: 'Search e621',
  args: true,
  usage: '<tags>',
  guildOnly: false,
  cooldown: 5,
  async execute(message, args) {
    const searchTerms = args.join('+');
    const length = 10;

    fetch(`https://e621.net/post/index.json?tags=${searchTerms}&limit=${length}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.length) {
          return message.reply(`no results were found for \`${searchTerms}\``);
        }

        if (json.success === false) {
          return message.reply(`your request was unsuccessful for the following reason: ${json.reason}. "${json.message}"`);
        }

        const result = json[Math.floor(Math.random() * json.length)];

        const embed = new Discord.RichEmbed()
          .setColor(randomHex.generate())
          .setTitle(args.join(' '))
          .setDescription(result.tags)
          .setImage(result.file_url)
          .setURL(result.file_url)
          .setAuthor(result.artist.join(' '))
          .setTimestamp(new Date(result.created_at.s * 1000));

        message.channel.send(embed).error(console.error);
      })
      .catch((err) => {
        console.error(err);
        return message.reply('an error occurred while performing the request to the API!');
      });
  },
};
