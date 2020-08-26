const { MessageEmbed } = require('discord.js');
const randomHex = require('random-hex');
const moment = require('moment');
const emojiRegex = /<:.+:(?<id>\d+)>/gu;

module.exports = {
  name: 'quickpoll',
  aliases: ['qpoll', 'qp'],
  description: 'Creates a poll given a title, pipe separated list of poll options (all in quotes), and an **equal-length** pipe separated list of poll choice emojis (also all in quotes). After a set amount of time, it will update the poll message with the winning poll item, based on the number of reacts for a given poll choice on the message. Hopefully the usage clarifies this a little bit.',
  usage: '[-t, --time (poll time, minutes [default: 60])] <"Poll title/question"> <"Poll item 1 | Poll item 2 | ..."> <"Poll choice emoji 1 | Poll choice emoji 2 | ...">',
  args: true,
  guildOnly: true,
  cooldown: 5,
  async execute(message, args) {
    // Get options and search query from args
    const timeFlagIndex = args.findIndex((val) => /^-t$|^--time$/giu.test(val));
    let pollTime = 60 * 60 * 1000; // 60 minutes, converted to ms
    if (timeFlagIndex > -1) {
      args.splice(timeFlagIndex, 1);
      const parsedTime = parseInt(args.splice(timeFlagIndex, 1), 10);
      if (isNaN(parsedTime)) return message.reply(`${parsedTime} is not a valid number!`);

      pollTime = parsedTime * 60 * 1000;
    }

    const reparsedArgs = args.join(' ').split('"').filter((val) => !(/^\s?$/giu.test(val)));
    const title = reparsedArgs.shift();
    const responses = reparsedArgs.shift().split(/\s*\|\s*/giu);
    const emojis = reparsedArgs.shift().split(/\s*\|\s*/giu).map((e) => e.trim());

    if (typeof title === 'undefined') return message.reply('you forgot to add a title!');
    if (typeof responses === 'undefined') return message.reply('you forgot to add a list of responses!');
    if (typeof emojis === 'undefined') return message.reply('you forgot to add a list of reactions');
    if (responses.length !== emojis.length) return message.reply(`you fool! You only provided ${emojis.length} emoji options for ${responses.length} questions!`);

    try {
      const embed = new MessageEmbed()
        .setColor(randomHex.generate())
        .setTitle(title);

      responses.forEach((val, index) => {
        embed.addField(`${emojis[index]}`, val, true);
      });

      const mPollTime = moment(moment() + pollTime);
      const sent = await message.channel.send(`This poll will end ${mPollTime.fromNow()}, at ${mPollTime.format('h:mm:ss a (Z) [on] dddd, MMMM Do, YYYY')}.`, { embed: embed });

      emojis.forEach(async (emoji) => {
        // get proper react emoji
        const guildEmoji = emojiRegex.exec(emoji);
        const react = (guildEmoji === null) ? emoji : message.guild.emojis.cache.get(guildEmoji.groups.id);

        // reset the regex (literally, the most important thing)
        emojiRegex.lastIndex = 0;

        // react
        await sent.react(react).catch((e) => {
          throw new Error(`Error reacting with ${react} - ${e}`);
        });
      });

      const collected = await sent.awaitReactions((reaction) => emojis.includes(reaction.emoji.toString()), { time: pollTime });
      const winningReacts = collected.sort((a, b) => a.count - b.count).filter((val, index, col) => val.count === col.last().count && val.count > 1);

      if (winningReacts.size > 1) {
        // tie between some reacts
        sent.edit(`There was a tie between ${winningReacts.map((react) => `"**${responses[emojis.indexOf(react.emoji.toString())]}**"`).join(', ')}, with each getting **${winningReacts[0].count - 1} votes**`)
          .catch((err) => { throw new Error(`Error editing message. (${err})`); });
      } else if (winningReacts.size === 1) {
        const winningReact = winningReacts.first();
        sent.edit(`The winning choice is "**${responses[emojis.indexOf(winningReact.emoji.toString())]}**" with **${winningReact.count - 1} votes**`)
          .catch((err) => { throw new Error(`Error editing message. (${err})`); });
      } else {
        sent.edit('There were no winners????')
          .catch((err) => { throw new Error(`Error editing message. (${err})`); });
      }
    } catch (e) {
      throw new Error(`An error occurred while creating the poll. (${e.message})`);
    }
  },
};
