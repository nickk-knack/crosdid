const { RichEmbed } = require('discord.js');
const randomHex = require('random-hex');
const { calc } = require('timethat');

module.exports = {
  name: 'about',
  description: 'Displays various information about the bot',
  args: false,
  guildOnly: false,
  cooldown: 3,
  execute(message, args) {
    const { db } = message.client;

    const globalThankCount = db.get('global_thank_count').value();
    const globalBadCount = db.get('global_bad_count').value();
    const globalGoodCount = db.get('global_good_count').value();
    const globalGoodBadSum = globalBadCount + globalGoodCount;
    const badPercent = globalGoodBadSum === 0 ? 0 : globalBadCount / globalGoodBadSum;
    const goodPercent = globalGoodBadSum === 0 ? 0 : globalGoodCount / globalGoodBadSum;

    const embed = new RichEmbed()
      .setColor(randomHex.generate())
      .setTitle('About the bot')
      .setThumbnail(message.client.user.avatarURL)
      .setAuthor(message.client.user.tag, message.client.user.displayAvatarURL)
      .setTimestamp(Date.now())
      .addField('How long have I been alive?', calc(message.client.user.createdTimestamp, Date.now()), true)
      .addField('Number of guilds I am in', message.client.guilds.size, true)
      .addField('Am I overall good or bad?', `I am ${Math.max(badPercent, goodPercent).toFixed(4) * 100}% ${badPercent > goodPercent ? 'bad...' : 'good!'}`, true)
      .addField("Total number of times I've been thanked 😇", globalThankCount, true);

    if (typeof message.guild !== 'undefined' && message.guild.available) {
      embed
        .addField("Number of times I've been called bad in this guild...", db.get(`${message.guild.id}.bad_count`).value(), true)
        .addField("Number of times I've been called good in this guild!", db.get(`${message.guild.id}.good_count`).value(), true)
        .addField("Number of times I've been called thanked in this guild 😇", db.get(`${message.guild.id}.thank_count`).value(), true);
    }

    if (typeof message.client.user.lastMessage !== 'undefined') {
      const { content } = message.client.user.lastMessage;
      if (content.length) embed.addField('Content of my last message', message.client.user.lastMessage.content);
    }

    message.channel.send(embed);
  },
};
