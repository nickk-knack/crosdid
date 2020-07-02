const { Attachment } = require('discord.js');
const randomHex = require('random-hex');
const fetch = require('node-fetch');

const SLIDER_COUNT = 32;

module.exports = {
  name: 'sona',
  aliases: ['fakesona', 'fs'],
  description: 'Sends an AI generated fursona directly to chat.',
  args: false,
  guildOnly: false,
  cooldown: 3,
  execute(message, args) {
    let hexString = '';
    let validString = false;
    let iterations = 0;

    if (args.length) {
      // TODO: take up to 30 values, convert to hex string
    }

    // generate hex string
    while (!validString) {
      for (let i = 0; i < SLIDER_COUNT; i++) {
        const rand = Math.floor(Math.random() * 256);
        let randStr = rand.toString(16).slice(-2);

        if (randStr.length === 1) {
          randStr = `0${randStr}`;
        }

        hexString += randStr;
      }

      iterations++;

      if (hexString.length === SLIDER_COUNT * 2) {
        // Break loop, it's valid
        validString = true;
      } else {
        // If this has taken more than 50 tries, abort
        if (iterations > 50) throw 'Could not generate a valid hex string';

        // Reset string and try again, wrong length
        hexString = '';
      }
    }

    const furUrl = `http://codeparade.net/furry/gen_${hexString}.jpg`;

    fetch(furUrl)
      .then((res) => res.buffer())
      .then((buffer) => {
        const attachment = new Attachment(buffer, 'sona.jpg');

        message.channel.send({
          files: [attachment],
          embed: {
            image: {
              url: 'attachment://sona.jpg',
            },
            color: parseInt(randomHex.generate(), 16),
          },
        }).catch(console.error);
      })
      .catch((err) => {
        console.error(err);
        message.reply('an error occured while trying to get your fursona.');
      });
  },
};
