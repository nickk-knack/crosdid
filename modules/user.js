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
		// I moved this check into the command processing code, but I'm leaving it commented just in case that fails
		// if (args.length < 2) return message.reply('Not enough arguments supplied!');
		if (message.mentions.everyone) return message.reply('You cannot target @everyone/@here!');

		// Don't need to get the user from the first argument, since it should be a mention
		// const user = args[0];
		const { db } = message.client;
		const subcommand = args[1].toLowerCase();
		const subcommandArg = args[2];
		const user = message.mentions.members.first();

		let dbUser = db.get(`${message.guild.id}.users`).find({ id: user.id });

		switch (subcommand) {
			case 'messages':
				dbUser = db.get('messages');
				break;
			case 'reacts':
				dbUser = db.get('reactions');
				break;
			case 'op':
				// Coerce subcommandArg into a boolean, write it to db
				dbUser.set('operator', !!subcommandArg).write();

				return message.reply(`Successfully made <@${user.id}> an operator for this bot.`);
			default:
				return message.reply(`${subcommand} is not a valid subcommand!`);
		}

		switch (subcommandArg) {
			case 'list':
			case 'l':
				
				break;
			case 'add':
			case '+':
			case 'a':
				if (args[3] === undefined) return message.reply(`You must provide the ${subcommand.substring(0, subcommand.length - 1)} you wish to add!`);

				if (subcommand === 'messages') {

				}

				break;
			case 'remove':
			case 'rem':
			case 'del':
			case '-':
				if (args[3] === undefined) return message.reply('You must provide the message/reaction you wish to add!');

				break;
			default:
				return message.reply(`${subcommandArg} is not a valid subcommand argument! (Expected: list, add, remove)`);
		}
	},
};
