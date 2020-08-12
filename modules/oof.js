const ytdl = require('ytdl-core');

module.exports = {
  name: 'oof',
  description: 'Oof\n-n : no sound',
  usage: '[-n]',
  args: false,
  guildOnly: true,
  execute(message, args) {
    // Maybe also send the following message to all text channels?
    const randO = Math.floor(Math.random() * 16);
    let oof = 'O';
    for (let i = 0; i < randO; i++) {
      oof += 'O';
    }
    oof += 'F';
    message.channel.send(oof);

    if (args.length && args[0] === '-n') {
      return;
    }

    const { channel } = message.member.voice;
    if (channel) {
      channel.join().then((connection) => {
        const stream = ytdl('https://www.youtube.com/watch?v=3kc70k14uDc', { filter: 'audioonly' });
        const dispatcher = connection.play(stream);

        dispatcher.on('finish', () => channel.leave());
      });
    }
  },
};
