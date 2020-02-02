const Discord = require('discord.js');
const fetch = require('node-fetch');
const randomHex = require('random-hex');

module.exports = {
  name: 'fakeperson',
  aliases: ['fp', 'porson', 'porsen', 'persen', 'porsin', 'fakedude'],
  description: 'Sends an AI generated person directly to chat.',
  args: false,
  cooldown: 3,
  execute(message, args, bot) {
    const personUrl = 'https://thispersondoesnotexist.com/image';

    fetch(personUrl)
      .then((res) => res.buffer())
      .then((buffer) => {
        const embed = new Discord.RichEmbed()
          .setColor(randomHex.generate())
          .attachFile(new Discord.Attachment(buffer, 'fakehuman0.png'));

        message.channel.send(embed).catch(console.error);
      })
      .catch((err) => {
        console.error(err);
        message.reply('an error occured while trying to get a fake human...');
      });
  },
};
