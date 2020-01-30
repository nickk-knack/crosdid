const Discord = require('discord.js');
const GoogleImages = require('google-images');
const randomHex = require('random-hex');
const GoogleAPIKey = process.env.GOOGLE_API_KEY;
const GoogleCSEID = process.env.GOOGLE_CSE_ID;

module.exports = {
	name: 'image',
	aliases: ['i'],
	description: 'Search Google Images for your query.',
	args: true,
	usage: '<search query>',
	guildOnly: false,
	cooldown: 3,
	execute(message, args) {
		const query = args.join(' ').trim();
		const client = new GoogleImages(GoogleCSEID, GoogleAPIKey);

		client.search(query)
			.then((images) => {
				// Check if there were no results
				if (!images.length) return message.reply(`No results found for \`${query}\``);

				// Get random image
				const randomImage = images[Math.floor(Math.random() * images.length)];
				// This check is technically legacy shit, but I'm going to leave it in "just in case"
				if (typeof randomImage === 'undefined') return message.reply(`No results found for \`${query}\``);

				const embed = new Discord.RichEmbed()
					.setColor(randomHex.generate())
					.setTitle(query)
					.setImage(randomImage.url);

				message.channel.send(embed);
			})
			.catch((e) => {
				switch (e.statusCode) {
					case 403:
						message.reply('I literally can\'t search anymore');
						break;
					case 404:
						message.reply(`No results found for \`${query}\``);
						break;
					default:
						console.error(e);
				}
			});
	},
};
