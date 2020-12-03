module.exports = {
  name: 'macode',
  aliases: ['mcode'],
  description: 'Encode your message in the\n:ZM: :ZA: :ZC:\n:ZC: :ZO: :ZD: :ZE:',
  guildOnly: false,
  args: true,
  cooldown: 1,
  execute(message, args) {
    const encodedArgs = args.map((a) => a.replace(/(?<char>[A-Za-z0-9])/gu, ':Z$<char>: ').toUpperCase());
    const encoded = encodedArgs.join('\n');
    message.channel.send(encoded);
  },
};
