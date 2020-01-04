// Load .env environment configuration
require('dotenv').config();

// Packages
const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Discord = require('discord.js');

// Plugins
const secretMessages = require('./plugins/secrets.js').secretMessages;
const guildPhrases = require('./plugins/secrets.js').guildPhrases;

// Environment constants
const prefix = process.env.PREFIX;
const token = process.env.TOKEN;
const port = process.env.PORT || 3000;

// Discord.js globals
const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

// TODO: rename commandFiles to moduleFiles
const commandFiles = fs.readdirSync('./modules');

console.log('Starting bot...');

// Load in all commands
console.log('\tLoading commands...');
for (const file of commandFiles) {
	const command = require(`./modules/${file}`);
	client.commands.set(command.name, command);
}
console.log('\tCommands loaded.');

// Events
console.log('\tLoading events...');
client.on('ready', () => {
	console.log(`\tLogged in as ${client.user.tag}!`);
	console.log('Finished loading!');
});

client.on('message', msg => {
	// Command needs to start with prefix
	const prefixRegex = new RegExp(`^(<@!?${client.user.id}> |\\${prefix})\\s*`);

	if (!prefixRegex.test(msg.content) || msg.author.bot) {
		// This is a regular message, do any other processing on it
		// This includes testing for secret phrases, deciding to send a secret message, etc.
		// Auto-dogan goes here too, but I should add a guild check
		// if (msg.author.id === '182615528383184896') {
		// 	if (Math.floor(Math.random() * 20) == 1) {
		// 		msg.react('268177866926194690');
		// 	}
		// }

		if (Object.keys(guildPhrases).find(msg.guild.id) !== undefined) {
			for (let phrase of Object.keys(guildPhrases[msg.guild.id])) {
				// Regex match phrase in msg.content
				// If it exists, msg.channel.send guildPhrases[msg.guild.id][phrase]
			}
		}

		// Ass-fixer
		const assMessages = [];
		const assTokens = msg.content.toLowerCase().match(/(\w*[\s-])ass(\s\w*)/g);

		if (assTokens) {
			for (let assToken of assTokens) {
				const fixedAss = assToken.match(/ass(\s\w*)/g)[0].replace(/\s/, '-');
				assMessages.push(fixedAss);
			}
		}

		msg.reply(assMessages.join(', '));

		// Secret messages

		// At the end, return
		return;
	}

	// Get command args and command name
	const [, matchedPrefix] = msg.content.match(prefixRegex);
	const args = msg.content.slice(matchedPrefix.length).split(/ +/);
	const commandName = args.shift();

	// Get the actual command object, check if it exists
	const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) {
		return 'That command does not exist!';
	}
});

client.on('disconnect', () => {
	console.log('bye bitch');
});

console.log('\tEvents loaded.');
console.log('\tLogging in...');
client.login(token);

// Set up for express
app.use(bodyParser.json());

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

app.get('/', (req, res) => {
	res.end('hello crosdid');
});
