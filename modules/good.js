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
  execute(message, args) {
    if (typeof message.guild !== 'undefined' && message.guild.available) {
      message.client.db.update(`${message.guild.id}.good_count`, (count) => count + 1).write();
    }

    message.client.db.update('global_good_count', (count) => count + 1).write();

    message.reply(responses[Math.floor(Math.random() * responses.length)]);
  },
};
