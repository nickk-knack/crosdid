// const { RichEmbed } = require('discord.js');
// const randomHex = require('random-hex');
// const fetch = require('node-fetch');

module.exports = {
  name: 'grave',
  description: '',
  usage: '<"Line 1"> ["Line 2"] ["Line 3"] ["Line 4"]',
  args: true,
  guildOnly: false,
  cooldown: 5,
  execute(message, args) {
    console.log('Args:', args);
    const reparsedArgs = args.join(' ').split('"').filter((val) => !/^\s?$/giu.test(val));
    console.log('Re-parsed args:', reparsedArgs);
    let url = `http://www.tombstonebuilder.com/generate.php?top1=${reparsedArgs.shift()}`;

    url += `&top2=${'line 2'}&top3=${'line3'}&top4=${'line 4'}&sp=`;

    console.log(url);
    // fetch(url)
    //   .then((res) => res.text())
    //   .then((text) => {
    //     const embed = new RichEmbed()
    //       .setColor(randomHex.generate())
    //       .setImage(text);

    //     message.reply(embed).catch(console.error);
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //     message.reply(`an error occurred while fetching that gravestone: \`${err.message}\``);
    //   });
  },
};
