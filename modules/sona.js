const { MessageAttachment } = require('discord.js');
const randomHex = require('random-hex');
const fetch = require('node-fetch');
const { generateRandomHexString, generateUserHexString } = require('../util');

const SLIDER_COUNT = 32;

module.exports = {
  name: 'sona',
  aliases: ['fakesona', 'fs'],
  description: 'Sends an AI generated fursona directly to chat.',
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
      const response = await fetch(`http://codeparade.net/furry/gen_${hexString}.jpg`);
      const buffer = await response.buffer();
      const attachment = new MessageAttachment(buffer, 'sona.jpg');

      await message.channel.send({
        files: [attachment],
        embed: {
          image: {
            url: 'attachment://sona.jpg',
          },
          color: parseInt(randomHex.generate(), 16),
        },
      });
    } catch (e) {
      throw new Error(`An error occured while trying to get your fursona. (${e.message})`);
    }
  },
};
