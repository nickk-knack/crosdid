const { RichEmbed } = require('discord.js');
const randomHex = require('random-hex');
const moment = require('moment');
const momentDurationFormatSetup = require('moment-duration-format');
momentDurationFormatSetup(moment);

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

    const createdMoment = moment(message.client.user.createdTimestamp);
    const nowMoment = moment();
    const life = moment.duration(nowMoment.diff(createdMoment));
    const lifeStr = life.format('Y [years], M [months], W [weeks], D [days], h [hours], m [minutes], s [seconds]');

    const embed = new RichEmbed()
      .setColor(randomHex.generate())
      .setTitle('About the bot')
      .setThumbnail(message.client.user.avatarURL)
      .setAuthor(message.client.user.tag, message.client.user.displayAvatarURL)
      .setTimestamp(Date.now())
      .setFooter('created with 💖 by nick')
      .setURL('https://github.com/nickk-knack/crosdid')
      .addField('How long have I been alive?', `${lifeStr} ago.`, true)
      .addField('Number of guilds I am in', message.client.guilds.size, true)
      .addField('Am I overall good or bad?', `I am ${Math.max(badPercent, goodPercent).toFixed(4) * 100}% ${badPercent > goodPercent ? 'bad...' : 'good!'}`, true)
      .addField("Total number of times I've been thanked 😇", globalThankCount, true);

    if (createdMoment.month() === nowMoment.month() && createdMoment.day() === nowMoment.day()) embed.addField('🎂 **Happy Birthday to Me!** 🎂', `I just turned **${life.years()}** years old.`, true);

    if (typeof message.guild !== 'undefined' && message.guild.available) {
      embed
        .addField("Number of times I've been called bad in this guild...", db.get(`${message.guild.id}.bad_count`).value(), true)
        .addField("Number of times I've been called good in this guild!", db.get(`${message.guild.id}.good_count`).value(), true)
        .addField("Number of times I've been thanked in this guild 😇", db.get(`${message.guild.id}.thank_count`).value(), true);
    }

    const { lastMessage } = message.client.user;
    if (typeof lastMessage !== 'undefined' && lastMessage !== null) {
      const { content } = lastMessage;
      if (content.length) embed.addField('Content of my last message', message.client.user.lastMessage.content);
    }

    message.channel.send(embed);
  },
};
