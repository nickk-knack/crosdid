const { Attachment } = require('discord.js');
const randomHex = require('random-hex');
const fetch = require('node-fetch');

const SLIDER_COUNT = 30;

module.exports = {
  name: 'garf',
  aliases: ['fakegarf', 'fg'],
  description: 'Sends an AI generated garfield comic directly to chat.',
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

      if (hexString.length === 60) {
        // Break loop, it's valid
        validString = true;
      } else {
        // If this has taken more than 50 tries, abort
        if (iterations > 50) throw 'Could not generate a valid hex string';

        // Reset string and try again, wrong length
        hexString = '';
      }
    }

    const garfUrl = `http://codeparade.net/garfield/gen_${hexString}.jpg`;

    // console.log(garfUrl);

    fetch(garfUrl)
      .then((res) => res.buffer())
      .then((buffer) => {
        const attachment = new Attachment(buffer, 'garf.jpg');

        message.channel.send({
          files: [attachment],
          embed: {
            image: {
              url: 'attachment://garf.jpg',
            },
            color: parseInt(randomHex.generate(), 16),
          },
        }).catch(console.error);
      })
      .catch((err) => {
        console.error(err);
        message.reply('an error occured while trying to get your garfield.');
      });
  },
};
