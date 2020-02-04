module.exports = {
  name: 'quit',
  aliases: ['exit', 'shutdown'],
  description: 'Shut the bot down',
  args: false,
  guildOnly: false,
  opOnly: true,
  cooldown: 1,
  execute(message, args) {
    message.reply('Goodbye!')
      .then(() => {
        message.client.destroy()
          .then(() => {
            console.log('Bot exited normally!');
          })
          .catch((e) => {
            console.error(e);
            console.log('Bot exited...? With an error for sure.');
          });
      })
      .catch((err) => {
        console.error(err);

        message.client.destroy()
          .then(() => {
            console.log('Bot exited normally!');
          })
          .catch((e) => {
            console.error(e);
            console.log('Bot exited...? With multiple errors lmao');
          });
      });
  },
};
