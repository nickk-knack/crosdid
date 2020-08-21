const { MessageAttachment } = require('discord.js');
const randomHex = require('random-hex');
const fetch = require('node-fetch');

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
  async execute(message, args) {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    try {
      const response = await fetch('https://thiscatdoesnotexist.com/');
      const buffer = await response.buffer();
      const cattachment = new MessageAttachment(buffer, 'fakecat.png');

      message.channel.send({
        files: [cattachment],
        embed: {
          title: randomMessage,
          image: {
            url: 'attachment://fakecat.png',
          },
          color: parseInt(randomHex.generate(), 16),
        },
      });
    } catch (err) {
      throw new Error(`an error occured while trying to get your cat! (${err})`);
    }
  },
};
