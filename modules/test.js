module.exports = {
  name: 'test',
  description: 'Test command for testing purposes',
  args: false,
  guildOnly: false,
  opOnly: true,
  cooldown: 1,
  execute(message, args) {
    message.channel.send(`Yeah, that's how commands work. Ping time: ${message.createdTimestamp - Date.now()}ms`);
  },
};
