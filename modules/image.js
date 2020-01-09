const Discord = require('discord.js');
const GoogleImages = require('google-images');
const fetch = require('node-fetch');
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
			.then(images => {
				// Get random image
				const randomImage = images[Math.floor(Math.random() * images.length)];
				if (typeof randomImage === 'undefined') message.reply(`No results found for \`${query}\``);

				const embed = new Discord.RichEmbed()
					.setColor(randomHex.generate())
					.setTitle(query)
					.setImage(randomImage.url);

				message.channel.send(embed);

				// New way of doing things, attaching image result directly to embed, didn't work tho. need 2 fix
				// fetch(randomImage.url)
				// 	.then(res => res.buffer)
				// 	.then(buffer => {
				// 		const attachment = new Discord.Attachment(buffer, `${query}.${randomImage.type}`);
				// 		embed.attachFile(attachment);
				// 		message.channel.send(embed);
				// 	})
				// 	.catch(e => {
				// 		console.error('Fetching image and reuploading failed! Falling back to url', e);
				// 		embed.setImage(randomImage.url);
				// 		message.channel.send(embed);
				// 	});
			})
			.catch(e => {
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
