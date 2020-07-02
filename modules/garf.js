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

    if (args.length) {
      // TODO: take up to 30 values, convert to hex string
    }

    // generate hex string
    for (let i = 0; i < SLIDER_COUNT; i++) {
      const rand = Math.floor(Math.random() * 256);
      hexString += rand.toString(16).slice(-2);
    }

    const garfUrl = `http://codeparade.net/garfield/gen_${hexString}.jpg`;

    console.log(garfUrl);

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
