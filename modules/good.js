const responses = [
  'thank',
  ':)',
  'yuh',
  'thanks, yo',
  'thanks',
  'aww, thanks',
  'yeet',
];

module.exports = {
  name: 'good',
  aliases: ['goodboy'],
  description: "Tell the bot that he's a good boy.",
  guildOnly: false,
  args: false,
  cooldown: 1,
  async execute(message, args) {
    const { db } = message.client;
    if (typeof message.guild !== 'undefined' && message.guild.available) {
      db.update(`guilds.${message.guild.id}.good_count`, (count) => count + 1).write();
    }

    db.update('global_good_count', (count) => count + 1).write();

    message.reply(responses[Math.floor(Math.random() * responses.length)]);
  },
};
