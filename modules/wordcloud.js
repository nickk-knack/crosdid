const { Attachment } = require('discord.js');
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
    // get message data (words map)
    const wordsMap = new Map();
    const rawMsgs = await message.channel.fetchMessages({ limit: 100 });
    console.log(`fetched ${rawMsgs.size} messages`);
    rawMsgs.forEach((msg) => {
      const { content } = msg;
      const wordRegex = /\w+/gu;
      const words = content.match(wordRegex);

      if (!words) {
        console.log(`no words found in message: "${content}"`);
      } else {
        for (const word of words) {
          // either add a new word to the map, or increment the words frequency
          wordsMap.set(word, 1 + (wordsMap.has(word) ? wordsMap.get(word) : 0));
        }
      }
    });
    console.log(`got ${wordsMap.size} words`);

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
    const can = new Canvas.Canvas(1, 1);

    // Build word cloud
    const endCloud = (w) => {
      console.log(`Finished word cloud, placed ${w.length} words.`);
      const cBuf = can.toBuffer();
      const attachment = new Attachment(cBuf, 'wordcloud.png');

      message.channel.send({
        files: [attachment],
        embed: {
          image: {
            url: 'attachment://wordcloud.png',
          },
          color: parseInt(randomHex.generate(), 16),
        },
      }).catch(console.error);
    };

    cloud().size([1200, 1000])
      .canvas(() => can)
      .words(words)
      .padding(5)
      .rotate(() => ~~(Math.random() * 2) * 90)
      .font('Tahoma')
      .fontSize((w) => w.size)
      .on('end', endCloud)
      .start();
  },
};
