const responses = [
  ':(',
  'oof',
  'ok :(',
  'aww :(',
  ':c',
  'wow',
  'why? :(',
  'ok :c',
  'mega oof',
];

module.exports = {
  name: 'bad',
  aliases: ['fuckoff'],
  description: 'Reprimand the bot.',
  guildOnly: false,
  args: false,
  cooldown: 1,
  async execute(message, args) {
    const { db } = message.client;
    if (typeof guild !== 'undefined' && message.guild.available) {
      db.update(`guilds.${message.guild.id}.bad_count`, (count) => count + 1).write();
    }

    db.update('global_bad_count', (count) => count + 1).write();

    message.reply(responses[Math.floor(Math.random() * responses.length)]);
  },
};
