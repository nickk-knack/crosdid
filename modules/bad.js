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
  execute(message, args) {
    if (typeof message.guild !== 'undefined' && message.guild.available) {
      message.client.db.update(`${message.guild.id}.bad_count`, (count) => count + 1).write();
    }

    message.client.db.update('global_bad_count', (count) => count + 1).write();

    message.reply(responses[Math.floor(Math.random() * responses.length)]);
  },
};
