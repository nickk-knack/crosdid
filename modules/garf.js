const { MessageAttachment } = require('discord.js');
const randomHex = require('random-hex');
const fetch = require('node-fetch');
const { generateRandomHexString, generateUserHexString } = require('../util');

const SLIDER_COUNT = 30;

module.exports = {
  name: 'garf',
  aliases: ['fakegarf', 'fg'],
  description: 'Sends an AI generated garfield comic directly to chat.',
  args: false,
  guildOnly: false,
  cooldown: 3,
  async execute(message, args) {
    let hexString = '';

    if (args.length && args.length <= SLIDER_COUNT) {
      hexString = generateUserHexString(SLIDER_COUNT, args);
    } else {
      hexString = generateRandomHexString(SLIDER_COUNT);
    }

    try {
      const response = await fetch(`http://codeparade.net/garfield/gen_${hexString}.jpg`);
      const buffer = await response.buffer();
      const attachment = new MessageAttachment(buffer, 'garf.jpg');

      message.channel.send({
        files: [attachment],
        embed: {
          image: {
            url: 'attachment://garf.jpg',
          },
          color: parseInt(randomHex.generate(), 16),
        },
      });
    } catch (err) {
      console.error(err);
      message.reply('an error occured while trying to get your garfield.');
    }
  },
};
