const { MessageAttachment } = require('discord.js');
const randomHex = require('random-hex');
const Canvas = require('canvas');
const cloud = require('d3-cloud');

module.exports = {
  name: 'wordcloud',
  aliases: ['wc', 'wcloud', 'cloud'],
  description: 'Generates a word cloud from the last 100 messages in the current channel.',
  args: false,
  guildOnly: true,
  cooldown: 10,
  async execute(message, args) {
    const { winston } = message.client;

    // get message data (words map)
    const wordsMap = new Map();
    const rawMsgs = await message.channel.messages.fetch({ limit: 100 });
    winston.info(`fetched ${rawMsgs.size} messages`);
    rawMsgs.forEach((msg) => {
      const { content } = msg;
      const wordRegex = /\w+/gu;
      const words = content.match(wordRegex);

      if (!words) {
        winston.info(`no words found in message: "${content}"`);
      } else {
        for (const word of words) {
          // either add a new word to the map, or increment the words frequency
          wordsMap.set(word, 1 + (wordsMap.has(word) ? wordsMap.get(word) : 0));
        }
      }
    });
    winston.info(`got ${wordsMap.size} words`);

    // compile chart data
    const words = [];
    const keysIt = wordsMap.keys();
    let curKey = keysIt.next();
    while (!curKey.done) {
      const key = curKey.value;
      words.push({
        text: key,
        size: (10 + wordsMap.get(key)) * 90,
      });

      curKey = keysIt.next();
    }

    // Instantiate canvas
    const can = new Canvas.Canvas(1200, 1000);

    // Build word cloud
    const endCloud = (w) => {
      winston.info(`Finished word cloud, placed ${w.length} words.`);
      const cBuf = can.toBuffer();
      const attachment = new MessageAttachment(cBuf, 'wordcloud.png');

      message.channel.send({
        files: [attachment],
        embed: {
          image: {
            url: 'attachment://wordcloud.png',
          },
          color: parseInt(randomHex.generate(), 16),
        },
      });
    };

    cloud().size([1200, 1000])
      .canvas(() => can)
      .words(words)
      .padding(5)
      .font('Tahoma')
      .fontSize((w) => w.size)
      .on('end', endCloud)
      .start();
  },
};
