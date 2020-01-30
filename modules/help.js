const Discord = require('discord.js');

module.exports = {
	name: 'help',
	aliases: ['commands'],
	description: 'List all commands/info about specific commands',
	usage: '[command name]',
	cooldown: 3,
	execute(message, args) {
		const prefix = process.env.PREFIX || message.client.user.toString();
		const { db, commands } = message.client;

		const embed = new Discord.RichEmbed().setColor('#DD11FF');
		if (!args.length) {
			embed.setTitle('Help/Commands')
				.setDescription('List of all my commands:')
				.addField(commands.map((command) => command.name).join(', '), `You can send ${prefix}help [command name] for info on a specific command.`);
		} else {
			const command = commands.get(args[0]) || commands.find((cmd) => cmd.aliases && cmd.aliases.includes(args[0]));

			if (!command) {
				return message.reply(`"${args[0]}" is not a valid command or alias!`);
			}

			if (command.opOnly) {
				const isOp = db.get(`${message.guild.id}.users`).find({ id: message.author.id }).get('operator').value();

				if (!isOp) {
					return message.reply('you do not have permission to view help for that command.');
				}
			}

			embed.setTitle(`Help/__${command.name}__`);

			if (command.description) {
				embed.setDescription(`**Description:** ${command.description}`);
			} else {
				embed.setDescription('No description available');
			}

			if (command.aliases) {
				embed.addField('Aliases:', command.aliases.join(', '));
			}

			if (command.usage) {
				embed.addField('Usage:', `${prefix}${command.name} ${command.usage}`);
			}

			if (command.opOnly || command.guildOnly) {
				const restrictions = [];
				if (command.opOnly) restrictions.push('Operators only');
				if (command.guildOnly) restrictions.push('Guild channels only');

				embed.addField('Restrictions:', restrictions.join(', '));
			}

			embed.addField('Cooldown:', `${command.cooldown || 1} second(s)`);
		}

		message.author.send(embed)
			.then(() => {
				if (message.channel.type !== 'dm') {
					if (!args.length) {
						message.reply('check your DMs for a list of my commands.');
					} else {
						const command = commands.get(args[0]) || commands.find((cmd) => cmd.aliases && cmd.aliases.includes(args[0]));
						message.reply(`check your DMs for help with the ${command.name} command.`);
					}
				}
			}).catch((e) => {
				console.error(e);
				message.reply('something went wrong while trying to DM you.');
			});
	},
};
