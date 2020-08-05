const { Attachment } = require('discord.js');
const randomHex = require('random-hex');
const fetch = require('node-fetch');

module.exports = {
  name: 'wordcloud',
  aliases: ['wc', 'wcloud', 'cloud'],
  usage: '[limit]',
  description: 'Generates a word cloud from the last 100 messages in the current channel. This 100 message limit can be changed by passing a new limit as the first argument.',
  args: false,
  guildOnly: true,
  cooldown: 10,
  async execute(message, args) {
    // set limit var
    let limit = 100;

    if (args.length) {
      const parsedLimit = parseInt(args.shift(), 10);
      if (isNaN(parsedLimit)) return message.reply('you entered an invalid limit!');

      limit = parsedLimit;
    }

    // get message data (words array)
    const rawMsgs = await message.channel.messages.fetchMessages({ limit: limit });
    console.log(`fetched ${rawMsgs.size} messages`);
    const wordsArr = [];
    rawMsgs.each((msg) => {
      const words = msg.content.match(/\w+/gu);
      wordsArr.concat(words);
    });
    console.log(`got ${wordsArr.length()} words`);

    // create color array (based on length of words array)
    const colorArray = [];
    const numColors = wordsArr.length % 10;
    for (let i = 0; i < numColors; i++) {
      colorArray.push(randomHex.generate());
    }

    // set up request
    const reqUrl = 'https://textvis-word-cloud-v1.p.rapidapi.com/v1/textToCloud';

    const headers = {
      'x-rapidapi-host': 'textvis-word-cloud-v1.p.rapidapi.com',
      'x-rapidapi-key': process.env.WORD_CLOUD_API_KEY,
      'content-type': 'application/json',
      'accept': 'application/json',
    };

    const data = {
      text: wordsArr.join(' '),
      scale: 1,
      width: 1200,
      height: 1000,
      colors: colorArray,
      font: 'Comic Sans MS',
      language: 'en',
      uppercase: false,
    };

    const opts = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    };

    // freakin send it
    fetch(reqUrl, opts)
      .then((res) => res.buffer())
      .then((buffer) => {
        const attachment = new Attachment(buffer, 'wordcloud.png');

        message.channel.send({
          files: [attachment],
          embed: {
            image: {
              url: 'attachment://wordcloud.png',
            },
            color: parseInt(randomHex.generate(), 16),
          },
        }).catch(console.error);
      })
      .catch((err) => {
        console.error(err);
        message.reply('an error occured while generating your word cloud.');
      });
  },
};
