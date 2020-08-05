const { Attachment } = require('discord.js');
const randomHex = require('random-hex');
const fetch = require('node-fetch');
const MIN_COLORS = 4;

module.exports = {
  name: 'wordcloud',
  aliases: ['wc', 'wcloud', 'cloud'],
  description: 'Generates a word cloud from the last 100 messages in the current channel.',
  args: false,
  guildOnly: true,
  cooldown: 10,
  async execute(message, args) {
    // get message data (words array)
    const rawMsgs = await message.channel.fetchMessages({ limit: 100 });
    console.log(`fetched ${rawMsgs.size} messages`);
    const wordsArr = [];
    rawMsgs.forEach((msg) => {
      const { content } = msg;
      const wordRegex = /\w+/gu;
      const words = content.match(wordRegex);

      if (!words) {
        console.log(`no words found in message: "${content}"`);
      } else {
        console.log(words);

        for (const word of words) {
          wordsArr.push(word);
        }
      }
    });
    console.log(`got ${wordsArr.length} words`);

    // create color array (based on length of words array)
    const colorArray = [];
    const numColors = (wordsArr.length / 10) + MIN_COLORS; // add a color for each 10 words
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
      .then((res) => res.text())
      .then((text) => {
        const buffer = Buffer.from(text, 'base64');
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
