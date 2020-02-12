const Discord = require('discord.js');
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
  execute(message, args) {
    const limit = 20;
    const query = args.join('+').trim();

    fetch(`https://rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${query}&limit=${limit}`)
      .then((res) => res.text())
      .then((body) => {
        parser(body.toString('utf8'))
          .then((result) => {
            const json = JSON.parse(JSON.stringify(result));
            const posts = json.posts.post;

            if (!posts.length) return message.channel.send(`No results found for **${query}**`);

            const randIndex = Math.floor(Math.random() * posts.length);
            const fileUrl = posts[randIndex].$.file_url;
            const embed = new Discord.RichEmbed()
              .setColor(randomHex.generate())
              .setTitle(args.join(' '))
              .setImage(fileUrl);

            message.channel.send(embed);
          })
          .catch((err) => {
            console.error(err);
            message.reply(`an error occurred while parsing the xml response! (\`${err.message}\`)`);
          });
      })
      .catch((err) => {
        console.error(err);
        message.reply(`something went wrong! (\`${err.message}\`)`);
      });
  },
};
