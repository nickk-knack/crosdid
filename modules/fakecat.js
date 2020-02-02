const Discord = require('discord.js');
const fetch = require('node-fetch');
const randomHex = require('random-hex');

const messages = [
  'heres your cat :3',
  'heres your cat uwu',
  'heres your cat UwU',
  'you wanted a cat?',
  'got a cat for you',
  'got a cat for you :3',
  'got a cat for you uwu',
  'got a cat for you UwU',
  'got a cat for u',
  'got a cat for u :3',
  'got a cat for u uwu',
  'got a cat for u UwU',
  'i got a cat for you',
  'i got a cat for you :3',
  'i got a cat for you uwu',
  'i got a cat for you UwU',
  'i gots a cat for you',
  'i gots a cat for you :3',
  'i gots a cat for you uwu',
  'i gots a cat for you UwU',
  'cat for you, sir',
  'cat for you, sir :3',
  'cat for you :3',
];

module.exports = {
  name: 'fakecat',
  aliases: ['cot', 'fc'],
  description: 'Sends an AI generated cat directly to chat.',
  args: false,
  guildOnly: false,
  cooldown: 3,
  execute(message, args) {
    const catUrl = 'https://thiscatdoesnotexist.com/';

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    fetch(catUrl)
      .then((res) => res.buffer())
      .then((buffer) => {
        const embed = new Discord.RichEmbed()
          .setColor(randomHex.generate())
          .setTitle(randomMessage)
          .attachFile(new Discord.Attachment(buffer, 'fakecat0.png'));

        message.channel.send(embed).catch(console.error);
      })
      .catch((err) => {
        console.error(err);
        message.reply('an error occured while trying to get your cat!');
      });
  },
};
