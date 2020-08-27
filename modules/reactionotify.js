module.exports = {
  name: 'reactionotify',
  aliases: ['rnotify', 'rn'],
  description: 'This command will allow you disable/enable reaction notifications from the bot.',
  usage: '<disable | enable>',
  args: true,
  guildOnly: true,
  execute(message, args) {
    const { db } = message.client;
    const action = args.shift().toLowerCase();

    switch (action) {
      case 'disable':
        db.get(`guilds.${message.guild.id}.users`)
          .find({ id: message.author.id })
          .set('reaction_notify', false)
          .write();
        return message.reply('successfully disabled reaction notifications for you.');
      case 'enable':
        db.get(`guilds.${message.guild.id}.users`)
          .find({ id: message.author.id })
          .set('reaction_notify', true)
          .write();
        return message.reply('successfully enabled reaction notifications for you.');
      default:
        return message.reply(`I don't know what you mean by "${action}"`);
    }
  },
};
