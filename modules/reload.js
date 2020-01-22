const fs = require('fs');

module.exports = {
	name: 'reload',
	description: 'Reloads the database and/or command modules',
	usage: '<all> | <-c [command] | -d>',
	args: true,
	guildOnly: false,
	opOnly: true,
	cooldown: 3,
	execute(message, args) {
		const mode = args.shift().toLowerCase();
		const { db } = message.client;

		if (mode === '-d' || mode === 'all') {
			console.log('Reading database...');
			db.read();
		}

		if (mode === '-c' || mode === 'all') {
			if (args.length > 1) {
				console.log('Reloading single command...');
				const commandName = args.shift().toLowerCase();
				const command = message.client.commands.get(commandName) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

				if (!command) {
					return message.reply(`there is no command with name/alias \`${commandName}\`.`);
				}

				delete require.cache[require.resolve(`./${commandName}.js`)];

				try {
					const newCommand = require(`./${commandName}.js`);
					message.client.commands.set(newCommand.name, newCommand);
				}
				catch (e) {
					console.error(e);
					return message.reply('there was an error while reloading that command.');
				}
			}
			else {
				console.log('Reloading all commands');
				const commandModules = fs.readdirSync('./modules');

				for (const file of commandModules) {
					if (!file.endsWith('.js')) continue;
					if (db.get('globalDisabledCmdModules').includes(file.split('.')[0]).value()) continue;

					delete require.cache[require.resolve(`./${file}`)];

					try {
						const command = require(`./${file}`);
						message.client.commands.set(command.name, command);
					}
					catch (e) {
						console.error(e);
						return message.reply(`there was an error while reloading commands at ${file}`);
					}
				}

				console.log(`\tAll command modules reloaded. Skipped the following: ${db.get('globalDisabledCmdModules').value().join(', ')}.`);
			}
		}

		message.reply('reload complete!');
	},
};
