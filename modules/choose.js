module.exports = {
  name: 'choose',
  description: 'Given a list of things seperated by pipes ( | ), the bot will choose one of them. Example of a list: thing1 | thing2 | thing43',
  usage: '<items>',
  args: true,
  guildOnly: false,
  cooldown: 1,
  execute(message, args) {
    const items = args.join(' ').split(/\s\|\s/gu);
    const randChoice = Math.floor(Math.random() * items.length);
    message.reply(`I choose ${items[randChoice]}!`);
  },
};
