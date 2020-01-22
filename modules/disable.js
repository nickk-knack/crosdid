const pokemon = [
	'Jigglypuff',
	'Wigglytuff',
	'Psyduck',
	'Golduck',
	'Kadabra',
	'Alakazam',
	'Slowbro',
	'Muk',
	'Drowzee',
	'Hypno',
	'Lickitung',
	'Mewtwo',
];

module.exports = {
	name: 'disable',
	description: 'Disable commands for the bot, globally or on a guild-by-build basis, on the fly.',
	usage: '<command name or alias> [-g] [-e]',
	args: true,
	minArgsLength: 1,
	guildOnly: false,
	opOnly: true,
	cooldown: 1,
	execute(message, args) {
		const { db, commands } = message.client;

		// Set global flag
		let global = false;
		const globalFlagIndex = args.indexOf('-g');
		if (globalFlagIndex !== -1) {
			args.splice(globalFlagIndex, 1);
			global = true;
		}

		// Get db reference
		let dbRef;
		if (global || typeof message.guild === 'undefined' || message.guild === null) {
			dbRef = db.get('globalDisabledCmdModules');
		}
		else {
			dbRef = db.get(`${message.guild.id}.disabledCmdModules`);
		}

		// Set enable flag
		let enable = false;
		const enableFlagIndex = args.indexOf('-e');
		if (enableFlagIndex !== -1) {
			args.splice(enableFlagIndex, 1);
			enable = true;
		}

		// Get commandName from args
		const commandName = args.shift().toLowerCase();

		// If we are enabling a command, do it here and return
		if (enable) {
			const index = dbRef.indexOf(commandName);
			if (index === -1) return message.reply(`\`${commandName}\` is not disabled, cannot enable it.`);

			dbRef.splice(index, 1).write();
			return message.reply(`Disable wore off for \`${commandName}\`!${global ? ' (reload commands to take effect)' : ''}`);
		}

		// Get reference to command
		const command = commands.get(commandName) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
		if (!command) {
			return message.reply(`there is no command with name/alias \`${commandName}\`.`);
		}

		// Disable the command
		dbRef.push(command.name).write();
		message.reply(`${pokemon[Math.floor(Math.random() * pokemon.length)]} used Disable! \`${command.name}\` can no longer be used.${global ? ' (reload commands to take effect)' : ''}`);
	},
};
