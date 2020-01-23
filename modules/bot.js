const Discord = require('discord.js');
const randomHex = require('random-hex');

module.exports = {
	name: 'bot',
	description: 'Modify various bot settings on the fly',
	usage: '<activity <enabled <true | false> | type <playing | streaming | listening | watching> | text <activity text>>> |\n\
<phrases <list | addtrigger <trigger> | addresponse <trigger index> <response> | removetrigger <trigger index> | removeresponse <trigger index> <response index>>> |\n\
<avatar <get | set <image url>>',
	args: true,
	minArgsLength: 2,
	guildOnly: true,
	opOnly: true,
	cooldown: 1,
	execute(message, args) {
		const { db } = message.client;
		const subcommand = args.shift().toLowerCase();
		const subcommandArg = args.shift().toLowerCase();

		if (subcommand === 'activity') {
			if (!args.length) return message.reply('you did not provide enough arguments to execute that command!');

			switch (subcommandArg) {
				case 'enabled':
					const enabled = !!args.shift().toLowerCase();
					db.set('activitySettings.enabled', enabled).write();

					message.reply(`successfully **${enabled ? 'enabled' : 'disabled'}** the bot's activity message.`);
					break;
				case 'type':
					const type = args.shift().toUpperCase();
					if (!['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING'].includes(type)) return message.reply(`invalid activity type: "${type}"`);

					db.set('activitySettings.type', type).write();

					message.reply(`successfully set the bot's activity type to "${type}".`);
					break;
				case 'text':
					const text = args.join(' ').trim();
					db.set('activitySettings.text', text).write();

					message.reply(`successfully set the bot's activity text to "${text}".`);
					break;
				default:
					return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: enabled, type, text)`);
			}

			const activitySettings = db.get('activitySettings').value();

			if (activitySettings.enabled) {
				message.client.user.setActivity(activitySettings.text, { type: activitySettings.type })
					.catch(e => {
						console.error(e);
						message.reply('there was an error setting the activity. Check the console for debugging information.');
					});
			}
			else {
				message.client.user.setActivity(null)
					.catch(e => {
						console.error(e);
						message.reply('there was an error setting the activity. Check the console for debugging information.');
					});
			}
		}
		else if (subcommand === 'phrases') {
			if (!args.length && subcommandArg !== 'list') return message.reply('you did not provide enough arguments to execute that command!');

			const dbPhrases = db.get(`${message.guild.id}.phrases`);

			switch (subcommandArg) {
				case 'list':
				case 'l': {
					const embed = new Discord.RichEmbed().setColor(randomHex.generate());
					let i = -1;

					for (const phrase of dbPhrases.value()) {
						embed.addField(`[Trigger ${++i}]: **${phrase.trigger}**`, `Responses: [\n${phrase.responses.map(r => `\t"${r}"`).join(',\n')}\n]`, true);
					}

					return message.reply(`Secret phrases for ${message.guild.name}:`, embed);
				}
				case 'addtrigger':
				case 'at': {
					const triggerPhrase = args.join(' ');
					if (dbPhrases.find({ trigger: triggerPhrase }).value()) return message.reply(`"${triggerPhrase}" already exists!`);

					dbPhrases.push({ trigger: triggerPhrase, responses: [] }).write();

					return message.reply(`Successfully added trigger phrase: "${triggerPhrase}".`);
				}
				case 'addresponse':
				case 'ar': {
					const triggerIndex = parseInt(args.shift(), 10);
					if (isNaN(triggerIndex) || triggerIndex >= dbPhrases.size().value()) return message.reply(`${triggerIndex} is out of bounds! [must be 0 - ${dbPhrases.size().value() - 1}]`);

					const dbPhraseObject = dbPhrases.get(triggerIndex);
					const dbPhraseResponses = dbPhraseObject.get('responses');
					const responsePhrase = args.join(' ');
					if (dbPhraseResponses.includes(responsePhrase).value()) return message.reply(`${responsePhrase} already exists for the given trigger index!`);

					dbPhraseResponses.push(responsePhrase).write();

					return message.reply(`Successfully added response phrase "${responsePhrase}" for trigger "${dbPhraseObject.get('trigger').value()}".`);
				}
				case 'removetrigger':
				case 'rt': {
					const triggerIndex = parseInt(args.shift(), 10);
					if (isNaN(triggerIndex) || triggerIndex >= dbPhrases.size().value()) return message.reply(`${triggerIndex} is out of bounds! [must be 0 - ${dbPhrases.size().value() - 1}]`);

					const removed = dbPhrases.pullAt(triggerIndex).write();
					return message.reply(`successfully removed "${removed[0].trigger}" as a trigger.`);
				}
				case 'removeresponse':
				case 'rr': {
					const triggerIndex = parseInt(args.shift(), 10);
					if (isNaN(triggerIndex) || triggerIndex >= dbPhrases.size().value()) return message.reply(`${triggerIndex} is out of bounds! [must be 0 - ${dbPhrases.size().value() - 1}]`);

					const dbPhraseObject = dbPhrases.get(triggerIndex);
					const dbPhraseResponses = dbPhraseObject.get('responses');
					const responseIndex = parseInt(args.shift(), 10);
					if (isNaN(responseIndex) || responseIndex >= dbPhraseResponses.size().value()) return message.reply(`${responseIndex} is out of bounds! [must be 0 - ${dbPhraseResponses.size().value() - 1}]`);

					const removed = dbPhraseResponses.pullAt(responseIndex).write();
					return message.reply(`successfully removed "${removed}" from the responses for "${dbPhraseObject.get('trigger').value()}".`);
				}
				default:
					return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: list, add, remove)`);
			}
		}
		else if (subcommand === 'avatar') {
			switch (subcommandArg) {
				case 'set':
					if (!args.length) return message.reply('you did not provide enough arguments to execute that command!');
					const avatarUrl = args.join(' ').trim();

					// This actually might be incredibly unsafe, since I'm not sanity checking the url.
					// It's possible that the url can be a path to a local file,
					// and that would be perfectly valid in this case.
					message.client.user.setAvatar(avatarUrl)
						.then(() => message.reply(`successfully set avatar to ${avatarUrl}`))
						.catch(e => {
							console.error(e);
							message.reply('there was an error setting the avatar. Check the console for debugging information.');
						});
					break;
				case 'get':
					return message.reply(message.client.user.avatarURL);
				default:
					return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: get, set)`);
			}
		}
		else {
			return message.reply(`\`${subcommand}\` is not a valid subcommand!`);
		}
	},
};
