const Discord = require('discord.js');
const randomHex = require('random-hex');
const { stripIndent } = require('common-tags');

module.exports = {
	name: 'bot',
	description: 'Modify various bot settings on the fly',
	usage: stripIndent`<activity <enable |
           disable |
           type <playing | streaming | listening | watching> |
           text <activity text>>> |
<phrases <enable |
          disable |
          list |
          addtrigger <trigger> |
          addresponse <trigger index> <response> |
          removetrigger <trigger index> |
          removeresponse <trigger index> <response index>>> |
<avatar <get | set <image url>>> |
<secret <messages | reacts> <enable |
         					 disable |
					         chance <get | 0.0 - 1.0>>> |
<reactionNotify <enable | disable>>`,
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
				case 'enable':
					db.set('activitySettings.enabled', true).write();
					message.reply('successfully **enabled** the bot\'s activity message.');
					break;
				case 'disable':
					db.set('activitySettings.enabled', false).write();
					message.reply('successfully **disabled** the bot\'s activity message.');
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
					return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: enable, disable, type, text)`);
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
				case 'enable':
				case 'e': {
					db.set(`${message.guild.id}.enablePhrases`, true);
					return message.reply('successfully **enabled** trigger phrases for the guild.');
				}
				case 'disable':
				case 'd': {
					db.set(`${message.guild.id}.enablePhrases`, false);
					return message.reply('successfully **disabled** trigger phrases for the guild.');
				}
				case 'list':
				case 'l': {
					const embed = new Discord.RichEmbed().setColor(randomHex.generate());
					let i = -1;

					for (const phrase of dbPhrases.value()) {
						embed.addField(`[Trigger ${++i}]: **${phrase.trigger}**`, `Responses: [\n${phrase.responses.map(r => `\t"${r}"`).join(',\n')}\n]`, true);
					}

					return message.reply(`secret phrases for ${message.guild.name}:`, embed);
				}
				case 'addtrigger':
				case 'at': {
					const triggerPhrase = args.join(' ');
					if (dbPhrases.find({ trigger: triggerPhrase }).value()) return message.reply(`"${triggerPhrase}" already exists!`);

					dbPhrases.push({ trigger: triggerPhrase, responses: [] }).write();

					return message.reply(`successfully added trigger phrase: "${triggerPhrase}".`);
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

					return message.reply(`successfully added response phrase "${responsePhrase}" for trigger "${dbPhraseObject.get('trigger').value()}".`);
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
		else if (subcommand === 'secret') {
			// Check that the subcommandArg is valid
			if (subcommandArg !== 'messages' && subcommandArg !== 'reacts') {
				return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: messages, reacts)`);
			}

			// Get the mode from the next arg, check that it is valid
			const mode = args.shift().toLowerCase();
			if (mode !== 'enabled' && mode !== 'chance') {
				return message.reply(`\`${mode}\` is not valid! (Expected: enabled, chance)`);
			}

			// Get the setting from the next arg, set the reply message
			let setting, msgReply;
			if (mode === 'enable') {
				setting = true;
				msgReply = `successfully **enabled** secret ${subcommandArg}.`;
			}
			else if (mode === 'disable') {
				setting = false;
				msgReply = `successfully **disabled** secret ${subcommandArg}.`;
			}
			else if (mode === 'chance') {
				setting = args.shift();
				if (setting === 'get') {
					return message.reply(`chance for secret ${subcommandArg}: ${db.get(`${message.guild.id}.secret_${subcommandArg}.${mode}`).value()}`);
				}

				setting = parseFloat(setting);
				if (isNaN(setting)) return message.reply(`${setting} is invalid! Expected a float between 0.0 and 1.0`);

				msgReply = `successfully set chance for secret ${subcommandArg} to ${setting}.`;
			}

			// Write new setting to db, return and reply to message
			db.set(`${message.guild.id}.secret_${subcommandArg}.${mode}`, setting).write();
			return message.reply(msgReply);
		}
		else if (subcommand === 'reactionNotify') {
			switch (subcommandArg) {
				case 'enable':
					db.set(`${message.guild.id}.${subcommand}`, true).write();
					return message.reply('successfully **enabled** reaction notification for the guild.');
				case 'disable':
					db.set(`${message.guild.id}.${subcommand}`, false).write();
					return message.reply('successfully **disabled** reaction notification for the guild.');
				default:
					return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: enable, disable)`);
			}
		}
		else {
			return message.reply(`\`${subcommand}\` is not a valid subcommand!`);
		}
	},
};
