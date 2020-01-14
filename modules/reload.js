module.exports = {
	name: 'reload',
	description: 'Forces a reload of the database.',
	guildOnly: false,
	// todo: enable args, let user choose to reload db or commands or both
	args: false,
	cooldown: 5,
	// todo: add user permissions, make this have permissionLevel:admin or smth
	execute(message, args) {
		const { db } = message.client;

		db.read();

		message.reply('reload complete!');
	},
};