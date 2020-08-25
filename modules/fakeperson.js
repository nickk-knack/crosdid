const { MessageAttachment } = require('discord.js');
const randomHex = require('random-hex');
const fetch = require('node-fetch');

module.exports = {
  name: 'fakeperson',
  aliases: ['fp', 'porson', 'porsen', 'persen', 'porsin', 'fakedude', 'fakeman', 'fh'],
  description: 'Sends an AI generated person directly to chat.',
  args: false,
  cooldown: 3,
  async execute(message, args) {
    try {
      const response = await fetch('https://thispersondoesnotexist.com/image');
      const buffer = await response.buffer();
      const attachment = new MessageAttachment(buffer, 'fakeperson.png');

      message.channel.send({
        files: [attachment],
        embed: {
          image: {
            url: 'attachment://fakeperson.png',
          },
          color: parseInt(randomHex.generate(), 16),
        },
      });
    } catch (err) {
      throw new Error(`An error occured while trying to get a fake human... (${err})`);
    }
  },
};
