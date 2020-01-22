module.exports = {
	name: 'user',
	description: 'Modify guild user db information for the **mentioned** user',
	usage: '<@user> <messages <list | add <string> | remove <index>>> | \n<reacts <list | add <string> | remove <index>>> | \n<op <true | false>>',
	args: true,
	minArgsLength: 3,
	guildOnly: true,
	opOnly: true,
	cooldown: 1,
	execute(message, args) {
		// Ensure that the mention target isn't @everyone or @here
		if (message.mentions.everyone) return message.reply('You cannot target @everyone/@here!');

		// Don't need to get the user from the first argument, since it should be a mention
		// Shift off the unneeded argument
		args.shift();

		const { db } = message.client;
		const subcommand = args.shift().toLowerCase();
		const subcommandArg = args.shift().toLowerCase();
		const user = message.mentions.members.first();

		let dbUser = db.get(`${message.guild.id}.users`).find({ id: user.id });

		switch (subcommand) {
			case 'messages':
				dbUser = dbUser.get('messages');
				break;
			case 'reacts':
				dbUser = dbUser.get('reactions');
				break;
			case 'op':
				// Coerce subcommandArg into a boolean, write it to db
				dbUser.set('operator', !!subcommandArg).write();

				return message.reply(`Successfully made ${user} an operator for this bot.`);
			default:
				return message.reply(`\`${subcommand}\` is not a valid subcommand!`);
		}

		const arr = dbUser.value();

		switch (subcommandArg) {
			case 'list':
			case 'l':
				let i = -1;

				if (subcommand === 'messages') {
					return message.reply(arr.map(x => `[${++i}.] "${x}"`).join('\n'));
				}
				else {
					return message.reply(arr.map(x => `[${++i}.] ${x.custom ? message.guild.emojis.get(x.emoji) : x.emoji}`).join('\n'));
				}
			case 'add':
			case 'a':
			case '+':
				// Ensure there are arguments left for the addition
				if (!args.length) return message.reply(`you must provide the ${subcommand.substring(0, subcommand.length - 1)} you wish to add!`);

				if (subcommand === 'messages') {
					const secretMessage = args.join(' ').trim();

					// Check if its a duplicate
					if (arr.includes(secretMessage)) {
						return message.reply(`${user} already has "${secretMessage}" as a secret message.`);
					}

					dbUser.push(secretMessage).write();
					return message.reply(`successfully added "${secretMessage}" as a secret message for ${user}`);
				}
				else {
					const emoji = args.shift();
					const emojiObj = { custom: false, emoji: emoji };

					if (emoji.includes(':')) {
						emojiObj.custom = true;
						emojiObj.emoji = emoji.substring(1, emoji.length - 1).split(':')[2];
					}

					// Check if its a duplicate (this might not be actually work)
					if (arr.includes(emojiObj)) {
						return message.reply(`${user} already has ${emojiObj.emoji} as a secret react.`);
					}

					dbUser.push(emojiObj).write();
					return message.reply(`successfully added ${emoji} as a secret react for ${user}`);
				}
			case 'remove':
			case 'rem':
			case 'delete':
			case 'del':
			case '-':
				// Ensure there is an argument for deletion
				if (!args.length) return message.reply('you must provide the message/reaction you wish to add!');

				// Get and parse index, check that its within bounds
				const index = parseInt(args.shift(), 10);
				if (isNaN(index) || index > arr.length) return message.reply(`${index} is out of bounds!`);

				const removed = dbUser.splice(index, 1);
				dbUser.write();

				return message.reply(`successfully removed ${removed} from ${user}'s secrets.`);
			default:
				return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: list, add, remove)`);
		}
	},
};
