const MAX_DICK_LENGTH = 50;

module.exports = {
  name: 'penis',
  aliases: ['cock', 'p', 'dick'],
  description: 'Generates a random length dick',
  args: false,
  cooldown: 1,
  execute(message, args) {
    const dickLength = Math.floor(Math.random() * MAX_DICK_LENGTH);
    let dick = '';

    for (let i = 0; i < dickLength; i++) {
      dick += '=';
    }

    message.reply(`8${dick}D`);
  },
};
