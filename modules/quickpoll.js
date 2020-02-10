const { RichEmbed } = require('discord.js');
const randomHex = require('random-hex');
const emojiRegex = (require('emoji-regex/es2015'))();

module.exports = {
  name: 'quickpoll',
  aliases: ['qpoll', 'qp'],
  description: 'Creates a poll given a title, pipe separated list of poll options (all in quotes), and an **equal-length** pipe separated list of poll choice emojis (also all in quotes). After a set amount of time, it will update the poll message with the winning poll item, based on the number of reacts for a given poll choice on the message. Hopefully the usage clarifies this a little bit.',
  usage: '[-t, --time (poll time, minutes [default: 60])] <"Poll title/question"> <"Poll item 1 | Poll item 2 | ..."> <"Poll choice emoji 1 | Poll choice emoji 2 | ...">',
  args: true,
  guildOnly: true,
  cooldown: 5,
  execute(message, args) {
    // Get options and search query from args
    const timeFlagIndex = args.findIndex((val) => /^-t$|^--time$/giu.test(val));
    let pollTime = 60 * 60 * 1000; // 60 minutes, converted to ms
    if (timeFlagIndex > -1) {
      args.splice(timeFlagIndex, 1);
      const parsedTime = parseInt(args.splice(timeFlagIndex, 1), 10);
      if (isNaN(parsedTime)) return message.reply(`${parsedTime} is not a valid number!`);

      pollTime = parsedTime * 60 * 1000;
    }

    const reparsedArgs = args.join(' ').split('"').filter((val) => !/^\s?$/giu.test(val));
    const title = reparsedArgs.shift();
    const responses = reparsedArgs.shift().split(/\s*\|\s*/giu);
    const emojis = reparsedArgs.shift().split(/\s*\|\s*/giu);

    if (typeof title === 'undefined') return message.reply('you forgot to add a title!');
    if (typeof responses === 'undefined') return message.reply('you forgot to add a list of responses!');
    if (typeof emojis === 'undefined') return message.reply('you forgot to add a list of reactions');
    if (responses.length !== emojis.length) return message.reply(`you fool! You only provided ${emojis.length} emoji options for ${responses.length} questions!`);

    console.log(title, responses, emojis);

    const embed = new RichEmbed()
      .setColor(randomHex.generate())
      .setTitle(title);

    responses.forEach((val, index) => {
      embed.addField(`Option ${emojiRegex.test(emojis[index]) ? emojis[index] : message.guild.emojis.find((e) => e.name === emojis[index])}`, val, true);
    });

    message.channel.send(`This poll will end in ${pollTime / 1000 / 60} minutes, at ${new Date(Date.now() + pollTime).toString()}`, embed)
      .then((msg) => {
        emojis.forEach((e) => emojiRegex.test(e) ? msg.react(e).catch(console.error) : msg.react(message.guild.emojis.find((el) => el.name === e)).catch(console.error));

        msg.awaitReactions((reaction) => emojis.includes(reaction.emoji), { time: pollTime })
          .then((collected) => {
            const winningReacts = collected.sort((a, b) => a.count - b.count).filter((val, index, arr) => val === arr[arr.length - 1]);
            // todo: winning reacts clearly doesnt work correctly
            console.log(winningReacts);

            if (winningReacts.length > 1) {
              // tie between some reacts
              msg.edit(`There was a tie between ${winningReacts.map((react) => `"**${responses[emojis.indexOf(react.emoji)]}**"`).join(', ')}, with each of ${winningReacts.map((react) => react.emoji).join(', ')} getting **${winningReacts[0].count} votes**`)
                .catch(console.error);
            } else if (winningReacts.length === 1) {
              const winningReact = winningReacts.shift();
              msg.edit(`The winning choice is "**${responses[emojis.indexOf(winningReact.emoji)]}**" with **${winningReact.count}** ${winningReact.emoji} **votes**`)
                .catch(console.error);
            } else {
              msg.edit('There were no winners????').catch(console.error);
            }
          });
      })
      .catch(console.error);
  },
};
