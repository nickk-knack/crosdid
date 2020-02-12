const { Attachment } = require('discord.js');
const randomHex = require('random-hex');
const fetch = require('node-fetch');

module.exports = {
  name: 'fakeperson',
  aliases: ['fp', 'porson', 'porsen', 'persen', 'porsin', 'fakedude'],
  description: 'Sends an AI generated person directly to chat.',
  args: false,
  cooldown: 3,
  execute(message, args) {
    const personUrl = 'https://thispersondoesnotexist.com/image';

    fetch(personUrl)
      .then((res) => res.buffer())
      .then((buffer) => {
        const attachment = new Attachment(buffer, 'fakeperson.png');

        message.channel.send({
          files: [attachment],
          embed: {
            image: {
              url: 'attachment://fakeperson.png',
            },
            color: parseInt(randomHex.generate(), 16),
          },
        });
      })
      .catch((err) => {
        console.error(err);
        message.reply('an error occured while trying to get a fake human...');
      });
  },
};
