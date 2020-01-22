// Load .env environment configuration
require('dotenv').config();
console.log('Parsed environment variables');

// Packages
const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Discord = require('discord.js');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// Environment constants
const prefix = process.env.PREFIX;
const token = process.env.TOKEN;
const port = process.env.PORT || 3000;
const DEBUG = process.env.PRINT_DEBUG || false;
const dbFileName = process.env.DB_FILE_NAME || 'db.json';

// Discord.js globals
const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

// lowdb setup
const adapter = new FileSync(dbFileName, {
	defaultValue: {
		// default disabled commands
		globalDisabledCmdModules: [
			'reddit',
			'cmdAliases',
		],
		activitySettings: {
			enabled: true,
			type: 'WATCHING',
			text: 'over my children',
			url: '',
		},
	},
});

const db = low(adapter);
client.db = db;
console.log(`Loaded local database file from ${dbFileName}`);

// Extra functions
const getRandomFromArray = array => array[Math.floor(Math.random() * array.length)];

// Start of the main bot code
console.log('Starting bot...');

// Load in all command modules
console.log('\tLoading command modules...');

const commandModules = fs.readdirSync('./modules');

for (const file of commandModules) {
	// If file is not a .js file or contained in the blacklist, skip it
	if (!file.endsWith('.js')) continue;
	if (db.get('globalDisabledCmdModules').includes(file.split('.')[0]).value()) continue;

	// Require the command module and set it in the client
	try {
		const command = require(`./modules/${file}`);
		client.commands.set(command.name, command);
	}
	catch (e) {
		console.error(`Error loading ${file}: `, e);
	}
}

console.log(`\t\tCommand modules loaded. Skipped the following: ${db.get('globalDisabledCmdModules').value().join(', ')}.`);

// Events
console.log('\tLoading events...');

// Ready event
client.on('ready', () => {
	console.log(`\tLogged in as ${client.user.tag}!`);

	// Go through joined guilds, make sure there is a per-guild config in db
	client.guilds.forEach(g => {
		// Check that the guild is available first
		if (!g.available) return;

		// Create guild config if non-existent
		if (!db.has(g.id).value()) {
			db.set(g.id, {
				reactionNotify: false,
				secret_messages: {
					enabled: false,
					chance: 0.05,
				},
				secret_reacts: {
					enabled: false,
					chance: 0.05,
				},
				users: [],
				disabledCmdModules: [],
				enablePhrases: true,
				phrases: [],
				announcements: {
					channel: '',
					channel_create: {
						enabled: false,
						messages: [],
					},
					channel_delete: {
						enabled: false,
						messages: [],
					},
					emoji_create: {
						enabled: false,
						channel_override: '',
						send_emoji: false,
						send_message: false,
						message_prepend: true,
						messages: [],
					},
					emoji_delete: {
						enabled: false,
						channel_override: '',
						send_emoji: false,
						send_message: false,
						message_prepend: true,
						messages: [],
					},
					emoji_update: {
						enabled: false,
						channel_override: '',
						send_emoji: false,
						send_message: false,
						message_prepend: true,
						messages: [],
					},
				},
			}).write();

			g.members.forEach(m => {
				if (!db.get(`${g.id}.users`).find({ id: m.id }).value()) {
					db.get(`${g.id}.users`).push({ id: m.id, messages: [], reactions: [], operator: false }).write();
				}
			});
		}
	});

	// Set the bot activity text
	const activitySettings = db.get('activitySettings').value();
	if (activitySettings.enabled) {
		client.user.setActivity(activitySettings.text, { type: activitySettings.type })
			.catch(console.error);
	}

	console.log('Finished loading!');
});

// Message event (command processing)
client.on('message', msg => {
	// Command needs to start with prefix
	const prefixRegex = new RegExp(`^(<@!?${client.user.id}> |\\${prefix})\\s*`);

	// Test if the message was a command
	if (!prefixRegex.test(msg.content)) {
		// This is a regular message, do any other processing on it

		// Ignore messages from discord/bots (especially yourself), and don't process non-guild messages
		if (msg.system || msg.author.bot || typeof msg.guild === 'undefined' || msg.guild === null) return;

		// TODO: Change secret messages/reacts chances and enable checking to be done from db

		// Check that the guild is configured with secret messages and reacts AND that the user has configured messages/reacts
		const userSecrets = db.get(`${msg.guild.id}.users`).find({ id: msg.author.id }).value();
		if (typeof userSecrets !== 'undefined') {
			// Calculate if we want to send a message and/or react
			const secretMessageChance = db.get(`${msg.guild.id}.secret_messages`).value();
			const sendSecretMessage = Math.random() > (1 - process.env.SECRET_MESSAGE_CHANCE);
			const secretlyReact = Math.random() > (1 - process.env.SECRET_REACT_CHANCE);

			// Get random message to send, send it
			if (sendSecretMessage) {
				const message = getRandomFromArray(userSecrets.messages);
				msg.reply(message);
			}

			// Get random reaction, react with it
			if (secretlyReact) {
				const reaction = getRandomFromArray(userSecrets.reactions);
				msg.react(reaction.custom ? msg.guild.emojis.get(reaction.emoji) : reaction.emoji);
			}
		}

		// Guild-based, phrase-activated messages
		const enablePhrases = db.get(`${msg.guild.id}.enablePhrases`).value();
		const lowerCaseContent = msg.content.toLowerCase();
		if (enablePhrases) {
			const guildPhrases = db.get(`${msg.guild.id}.phrases`).value();
			if (typeof guildPhrases !== 'undefined') {
				for (const guildPhrase of guildPhrases) {
					if (lowerCaseContent.includes(guildPhrase.trigger) && guildPhrase.responses) {
						msg.channel.send(getRandomFromArray(guildPhrase.responses));
					}
				}
			}
		}

		// Ass-fixer
		const assMessages = [];
		const assTokens = lowerCaseContent.match(/(\w*[\s-])ass(\s\w*)/g);
		if (assTokens && assTokens !== null) {
			for (const assToken of assTokens) {
				const fixedAss = assToken.match(/ass(\s\w*)/g)[0].replace(/\s/, '-');
				assMessages.push(fixedAss);
			}
		}

		if (assMessages.length > 0) msg.reply(assMessages.join(', '));

		// At the end, return.
		return;
	}

	// Get command args and command name
	const [, matchedPrefix] = msg.content.match(prefixRegex);
	const args = msg.content.slice(matchedPrefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();

	// Get the actual command object, check if it exists
	const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) {
		return msg.reply('That command does not exist!');
	}

	// Check if the command is in the guild's disabledCmdModules list
	const disabledCmdModules = db.get(`${msg.guild.id}.disabledCmdModules`).value();
	if (disabledCmdModules && disabledCmdModules.includes(command.name)) {
		return msg.reply('That command does not exist!');
	}

	// Check if the user can execute the command (opOnly)
	const isOp = db.get(`${msg.guild.id}.users`).find({ id: msg.author.id }).get('operator').value();
	if (command.opOnly && !isOp) {
		return msg.reply('you do not have permission to execute that command!');
	}

	// Check if command needs to be sent in a server
	if (command.guildOnly && msg.channel.type !== 'text') {
		return msg.reply('I can\'t execute that command in a DM.');
	}

	// Check if args are required, or if not enough args are passed
	if (command.args && (!args.length || command.minArgsLength > args.length)) {
		let reply = `You didn't provide ${command.minArgsLength > args.length ? 'enough' : 'any'} arguments, ${msg.author}.`;

		if (command.usage) {
			reply += `\nProper usage: "${prefix}${command.name} ${command.usage}"`;
		}

		return msg.channel.send(reply);
	}

	// Set cooldown
	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown) * 1000;

	if (!timestamps.has(msg.author.id)) {
		timestamps.set(msg.author.id, now);
		setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);
	}
	else {
		const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return msg.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before using the ${command.name} command.`);
		}

		timestamps.set(msg.author.id, now);
		setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);
	}

	// Execute command
	try {
		command.execute(msg, args);
	}
	catch (error) {
		console.error(error);
		msg.reply('there was an error executing that command :(');
	}
});

// Emoji creation event
client.on('emojiCreate', emoji => {
	// Maybe create a rich embed instead, send a full size version of the emoji?
	const settings = db.get(`${emoji.guild.id}.announcements.emoji_create`).value();
	const emojiChannelName = typeof settings.channel_override !== 'undefined' ? settings.channel_override : db.get(`${emoji.guild.id}.announcements.channel`).value();
	const emojiChannel = emoji.guild.channels.find(c => c.name === emojiChannelName);

	if (settings.send_emoji) {
		let message = '';

		if (settings.send_message) {
			message = settings.message_prepend ? `${getRandomFromArray(settings.messages)} ${emoji.toString()}` : `${emoji.toString()} ${getRandomFromArray(settings.messages)}`;
		}
		else {
			message = emoji.toString();
		}

		emojiChannel.send(message);
	}
});

client.on('emojiDelete', emoji => {
	// need to send something other than the emoji bc that wont work lol
	const settings = db.get(`${emoji.guild.id}.announcements.emoji_delete`).value();
	const emojiChannelName = typeof settings.channel_override !== 'undefined' ? settings.channel_override : db.get(`${emoji.guild.id}.announcements.channel`).value();
	const emojiChannel = emoji.guild.channels.find(c => c.name === emojiChannelName);

	if (settings.send_emoji) {
		let message = '';

		if (settings.send_message) {
			message = settings.message_prepend ? `${getRandomFromArray(settings.messages)} ${emoji.toString()}` : `${emoji.toString()} ${getRandomFromArray(settings.messages)}`;
		}
		else {
			message = emoji.toString();
		}

		emojiChannel.send(message);
	}
});

// Emoji update event (didnt fire for updating emoji name, should figure it out)
client.on('emojiUpdate', (oldEmoji, newEmoji) => {
	// Similar to creation, inform about updates to an emoji
	const settings = db.get(`${newEmoji.guild.id}.announcements.emoji_update`).value();
	const emojiChannelName = typeof settings.channel_override !== 'undefined' ? settings.channel_override : db.get(`${newEmoji.guild.id}.announcements.channel`).value();
	const emojiChannel = newEmoji.guild.channels.find(c => c.name === emojiChannelName);

	let message = '';

	if (settings.send_old_emoji || settings.send_new_emoji) {
		if (settings.send_message) {
			message = settings.message_prepend ?
				`${getRandomFromArray(settings.messages)} ${settings.send_old_emoji ? oldEmoji.name : ''}${settings.send_old_emoji && settings.send_new_emoji ? ' -> ' : ''}${settings.send_new_emoji ? newEmoji.name : ''}` :
				`${settings.send_old_emoji ? oldEmoji.name : ''}${settings.send_old_emoji && settings.send_new_emoji ? ' -> ' : ''}${settings.send_new_emoji ? newEmoji.name : ''} ${getRandomFromArray(settings.messages)}`;
		}
		else {
			message = `${settings.send_old_emoji ? oldEmoji.name : ''}${settings.send_old_emoji && settings.send_new_emoji ? ' -> ' : ''}${settings.send_new_emoji ? newEmoji.name : ''}`;
		}

		emojiChannel.send(message);
	}
});

// Message reaction add event
client.on('messageReactionAdd', (reaction, user) => {
	// Any other reaction processing goes here:
	// (i.e., giving a user a role on a react; add some stuff to events.js plugin to support this)

	// Auto-alert on react code (enabled on a per-guild basis)
	// TODO: Maybe change message out to be a rich embed
	if (db.get(`${reaction.message.guild.id}.reactionNotify`).value()) {
		// first check that you can send pms to the author! (i.e. that its not a bot)
		if (reaction.message.author.bot) return;

		// Get message author, and begin message content
		const author = reaction.message.author;
		let message = `${user.tag} reacted to your message,\n> ${reaction.message.content}\nwith `;

		// detect if the emoji is a guild emoji (true) or regular emoji (false), append to message
		if (typeof reaction.emoji.url !== 'undefined') {
			message += `guild emoji ${reaction.emoji.name} (${reaction.emoji.url})`;
		}
		else {
			message += `${reaction.emoji}`;
		}

		// Send message to author
		author.send(message);
	}
});

// Rate limiting event
client.on('rateLimit', info => {
	if (DEBUG) console.warn('Rate limiting shit:', info);
});

// Channel creation event (for announcement)
client.on('channelCreate', channel => {
	// Only notify the creation of text and voice channels (when enabled)
	if (channel.type !== 'text' && channel.type !== 'voice' || !settings.enabled) return;

	// Get settings for this event from the db
	const settings = db.get(`${channel.guild.id}.announcements.channel_create`).value();

	// Get a reference to the defined announcements channel
	const announcementsChannel = channel.guild.channels.find(c => c.name === db.get(`${channel.guild.id}.announcements.channel`).value());
	// Bail if the channel doesn't exist
	if (typeof announcementsChannel === 'undefined') return console.error(`The defined announcements channel for guild id ${channel.guild.id} is invalid!`);

	// Send random message from appropriate messages array + the new channel name to announcements channel
	const message = `${getRandomFromArray(settings.messages)} ${channel.toString()}`;
	announcementsChannel.send(message);
});

// Channel deletion event (for announcement)
client.on('channelDelete', channel => {
	// Only notify the deletion of text and voice channels (when enabled)
	if (channel.type !== 'text' && channel.type !== 'voice' || !settings.enabled) return;

	// Get settings for this event from the db
	const settings = db.get(`${channel.guild.id}.announcements.channel_delete`).value();

	// Get a reference to the defined announcements channel
	const announcementsChannel = channel.guild.channels.find(c => c.name === db.get(`${channel.guild.id}.announcements.channel`).value());
	// Bail if the channel doesn't exist
	if (typeof announcementsChannel === 'undefined') return console.error(`The defined announcements channel for guild id ${channel.guild.id} is invalid!`);

	// Send random message from appropriate messages array + the new channel name to announcements channel
	const message = `${getRandomFromArray(settings.messages)} ${channel.toString()}`;
	announcementsChannel.send(message);
});

// Logging events
client.on('error', error => console.error(error));
client.on('warn', warn => console.warn(warn));
// if (DEBUG) client.on('debug', info => console.info(info));

console.log('\tEvents loaded.');

// Client login
console.log('\tLogging in...');
client.login(token);

// Set up express webserver
app.use(bodyParser.json());

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

app.get('/', (req, res) => {
	res.end('hello crosdid');
});
