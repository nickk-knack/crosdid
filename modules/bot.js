module.exports = {
	name: 'bot',
	description: 'Modify various bot settings on the fly',
	usage: '<activity <enabled <true | false> | type <playing | streaming | listening | watching> | text <activity text> | url <activity url>>> |\n\
<phrases <list | addtrigger <trigger phrase> | addresponse <trigger phrase index> <response phrase> | remove <index>>> |\n\
<avatar <image url>',
	args: true,
	minArgsLength: 3,
	guildOnly: true,
	opOnly: true,
	cooldown: 1,
	execute(message, args) {
		const { db } = message.client;
		const subcommand = args.shift().toLowerCase();
		const subcommandArg = args.shift().toLowerCase();

		if (subcommand === 'activity') {
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
				case 'url':
					const url = args.join(' ').trim();
					db.set('activitySettings.url', url).write();

					message.reply(`successfully set the bot's activity url to "${url}".`);
					break;
				default:
					return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: enabled, type, text, url)`);
			}

			const activitySettings = db.get('activitySettings').value();

			if (activitySettings.enabled) {
				message.client.user.setActivity(activitySettings.text, { type: activitySettings.type, url: activitySettings.url })
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
			switch (subcommandArg) {
				case 'list':
					break;
				case 'add':
					break;
				case 'remove':
					break;
				default:
					return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: list, add, remove)`);
			}
		}
		else if (subcommand === 'avatar') {
			const avatarUrl = args.join(' ').trim();
			message.client.user.setAvatar(avatarUrl)
				.then(() => message.reply(`successfully set avatar to ${avatarUrl}`))
				.catch(e => {
					console.error(e);
					message.reply('there was an error setting the avatar. Check the console for debugging information.');
				});
		}
		else {
			return message.reply(`\`${subcommand}\` is not a valid subcommand!`);
		}
	},
};
