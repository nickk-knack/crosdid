const fs = require('fs');

module.exports = {
	name: 'reload',
	description: 'Forces a reload of the database.',
	usage: '<db | commands | both>',
	args: true,
	guildOnly: false,
	cooldown: 5,
	opOnly: true,
	execute(message, args) {
		const { db, commands } = message.client;

		if (args[0] === 'db' || args[0] === 'both') {
			console.log('Reading database...');
			db.read();
		}

		if (args[0] === 'commands' || args[0] === 'both') {
			console.log('Reloading commands...');
			commands.clear();

			const commandModules = fs.readdirSync('./modules');

			for (const file of commandModules) {
				// If file is not a .js file or contained in the blacklist, skip it
				if (!file.endsWith('.js')) continue;
				if (db.get('globalDisabledCmdModules').includes(file.split('.')[0]).value()) continue;

				// Require the command module and set it in the client
				const command = require(`./modules/${file}`);
				commands.set(command.name, command);
			}
		}

		message.reply('reload complete!');
	},
};
