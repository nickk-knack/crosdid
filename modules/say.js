module.exports = {
  name: 'say',
  description: 'Send a message to the mentioned channel as the bot',
  usage: '<channel mention> <message>',
  args: true,
  guildOnly: true,
  opOnly: true,
  cooldown: 0,
  execute(message, args) {
    const channel = message.mentions.channels.cache.first();
    args.shift();
    channel.send(args.join(' '));
  },
};
