const responses = [
  'ur welcome',
  'you\'re welcome',
  'ur welc',
  'no prob',
  'sure thing',
  'uh huh',
  'yeet',
];

module.exports = {
  name: 'thank',
  aliases: ['thanks'],
  description: 'Thank the bot.',
  guildOnly: false,
  args: false,
  cooldown: 1,
  async execute(message, args) {
    const { db } = message.client;
    if (typeof message.guild !== 'undefined' && message.guild.available) {
      db.update(`guilds.${message.guild.id}.thank_count`, (count) => count + 1).write();
    }

    db.update('global_thank_count', (count) => count + 1).write();

    message.reply(responses[Math.floor(Math.random() * responses.length)]);
  },
};
