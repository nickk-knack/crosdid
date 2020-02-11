const { RichEmbed } = require('discord.js');
const randomHex = require('random-hex');
const moment = require('moment');

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
    const life = moment.duration(createdMoment.diff(nowMoment));
    let durStr = '';
    if (life.years()) durStr += `${Math.abs(life.years())} year${Math.abs(life.years()) > 1 ? 's' : ''}, `;
    if (life.months()) durStr += `${Math.abs(life.months())} month${Math.abs(life.months()) > 1 ? 's' : ''}, `;
    if (life.weeks()) durStr += `${Math.abs(life.weeks())} week${Math.abs(life.weeks()) > 1 ? 's' : ''}, `;
    if (life.days()) durStr += `${Math.abs(life.days())} day${Math.abs(life.days()) > 1 ? 's' : ''}, `;
    if (life.hours()) durStr += `${Math.abs(life.hours())} hour${Math.abs(life.hours()) > 1 ? 's' : ''}, `;
    if (life.minutes()) durStr += `${Math.abs(life.minutes())} minute${Math.abs(life.minutes()) > 1 ? 's' : ''}, `;
    if (life.seconds()) durStr += `${Math.abs(life.seconds())} second${Math.abs(life.seconds()) > 1 ? 's' : ''}.`;

    if (createdMoment.month() === nowMoment.month() && createdMoment.day() === nowMoment.day()) durStr += ' It is currently my birthday!';

    const embed = new RichEmbed()
      .setColor(randomHex.generate())
      .setTitle('About the bot')
      .setThumbnail(message.client.user.avatarURL)
      .setAuthor(message.client.user.tag, message.client.user.displayAvatarURL)
      .setTimestamp(Date.now())
      .setFooter('created with 💖 by nick')
      .setURL('https://github.com/nickk-knack/crosdid')
      .addField('How long have I been alive?', durStr, true)
      .addField('Number of guilds I am in', message.client.guilds.size, true)
      .addField('Am I overall good or bad?', `I am ${Math.max(badPercent, goodPercent).toFixed(4) * 100}% ${badPercent > goodPercent ? 'bad...' : 'good!'}`, true)
      .addField("Total number of times I've been thanked 😇", globalThankCount, true);

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
