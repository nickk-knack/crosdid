const { MessageEmbed } = require('discord.js');
const randomHex = require('random-hex');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

module.exports = {
  name: 'ph',
  aliases: ['porn', 'pornhub', 'fap'],
  description: 'Searches pornhub for a gif or video.',
  usage: '<gif | vid> <search terms>',
  args: true,
  cooldown: 5,
  async execute(message, args) {
    const contentType = args.shift().toLowerCase();
    const query = args.join(' ');

    // Check for invalid content type
    if (contentType !== 'gif' && contentType !== 'vid') {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    // Set up embed
    const embed = new MessageEmbed()
      .setColor(randomHex.generate())
      .setDescription(`"${query}"`);

    try {
      // Fetch URL, load body using cheerio
      const url = `https://www.pornhub.com/${contentType === 'gif' ? 'gifs' : 'video'}/search?search=${query.replace(/\s/gu, '+')}&page=1`;
      const response = await fetch(url);
      const body = await response.text();
      const $ = cheerio.load(body);
      let result = {};

      // Populate results using appropriate parsing method
      if (contentType === 'gif') {
        // gif parsing
        const gifs = $('ul.gifs.gifLink li.gifVideoBlock');
        const results = gifs.map((i, gif) => {
          const data = $(gif).find('a');

          return {
            title: data.find('span').text(),
            url: `https://dl.phncdn.com${data.attr('href')}.gif`,
            webm: data.find('video').attr('data-webm'),
          };
        }).get();

        if (!results.length) return message.reply(`no gif results found for "${query}".`);

        // Select a random result
        result = results[Math.floor(Math.random() * results.length)];

        embed
          .setURL(result.url)
          .setImage(result.url);
        if (result.webm) embed.setURL(result.webm);
      } else {
        // video parsing
        const videos = $('ul.videos.search-video-thumbs li.pcVideoListItem');
        const results = videos.map((i) => {
          const data = videos.eq(i);

          if (!data.length) {
            return;
          }

          const thumb = data.find('img').attr('src') || '';
          const urlAnchor = data.find('a').eq(0);

          return {
            title: urlAnchor.attr('title'),
            url: `https://pornhub.com${urlAnchor.attr('href')}`,
            duration: data.find('.duration').text(),
            thumb: thumb, // thumb.replace(/\([^)]*\)/gu, ''),
          };
        }).get().filter((e) => !e.url.includes('javascript:void(0)'));

        if (!results.length) return message.reply(`no video results found for "${query}".`);

        // Select a random result
        result = results[Math.floor(Math.random() * results.length)];

        embed.setURL(result.url);
        if (result.duration) embed.setFooter(`duration: ${result.duration}`);
        if (result.thumb && result.thumb.startsWith('https://')) embed.setThumbnail(result.thumb);
      }

      // Finish embed and send
      embed.setTitle(result.title);
      await message.channel.send(embed);
    } catch (err) {
      throw new Error(`An error occurred while making the request: ${err}`);
    }
  },
};
