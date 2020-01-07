// Load .env environment configuration
require('dotenv').config();

// Packages
const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Discord = require('discord.js');

// Plugins
const secrets = require('./plugins/secrets.js');
const replies = secrets.replies;
const guildPhrases = secrets.guildPhrases;
const eventHelpers = require('./plugins/events.js');

// Environment constants
const prefix = process.env.PREFIX;
const token = process.env.TOKEN;
const port = process.env.PORT || 3000;
const DEBUG = false; // process.env.DEBUG || false;

// Discord.js globals
const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

// Extra functions
const getRandomFromArray = array => array[Math.floor(Math.random() * array.length)];

// Start of the main bot code
console.log('Starting bot...');

// Load in all command modules
// Also todo: support a command loading blacklist
console.log('\tLoading command modules...');

const commandModules = fs.readdirSync('./modules');

for (const file of commandModules) {
	if (!file.endsWith('.js')) return;

	const command = require(`./modules/${file}`);
	client.commands.set(command.name, command);
}

console.log('\tCommand modules loaded.');

// Events
console.log('\tLoading events...');

// Ready event
client.on('ready', () => {
	console.log(`\tLogged in as ${client.user.tag}!`);

	client.user.setActivity('over my children', { type: 'WATCHING' });

	console.log('Finished loading!');
});

// Message event (command processing)
client.on('message', msg => {
	if (DEBUG) if (!msg.author.bot) console.log(msg);

	// Command needs to start with prefix
	const prefixRegex = new RegExp(`^(<@!?${client.user.id}> |\\${prefix})\\s*`);

	// Test if the message was a command
	if (!prefixRegex.test(msg.content)) {
		// This is a regular message, do any other processing on it

		// Ignore messages from bots (especially yourself)
		if (msg.author.bot) return;

		// Only want the following to run in a guild, not a DM
		if (typeof msg.guild === 'undefined' || msg.guild === null) return;

		// Check that the guild is configured with secret messages and reacts AND that the user has configured messages/reacts
		if (Object.keys(replies).find(guild_id => guild_id === msg.guild.id) !== undefined &&
			Object.keys(replies[msg.guild.id]).find(user_id => user_id === msg.author.id) !== undefined) {
			// Calculate if we want to send a message and/or react
			const sendSecretMessage = Math.random() > (1 - process.env.SECRET_MESSAGE_CHANCE);
			const secretlyReact = Math.random() > (1 - process.env.SECRET_REACT_CHANCE);

			// Get random message to send, send it
			if (sendSecretMessage) {
				const message = getRandomFromArray(replies[msg.guild.id][msg.author.id].messages);
				msg.reply(message);
			}

			// Get random reaction, react with it
			if (secretlyReact) {
				const reaction = getRandomFromArray(replies[msg.guild.id][msg.author.id].reactions);
				msg.react(reaction.custom ? msg.guild.emojis.get(reaction.emoji) : reaction.emoji);
			}
		}

		// Guild-based, phrase-activated messages
		if (Object.keys(guildPhrases).find(guild_id => guild_id === msg.guild.id) !== undefined) {
			for (let phrase of Object.keys(guildPhrases[msg.guild.id])) {
				if (msg.content.includes(phrase)) {
					msg.channel.send(guildPhrases[msg.guild.id][phrase]);
				}
			}
		}

		// Ass-fixer (does not work, sends bot into infinite message loop)
		// TODO: I likely fixed the infinite looping, but it tried to fix a message that didn't need fixing I think
		// Look further into this
		// const assMessages = [];
		// const assTokens = msg.content.toLowerCase().match(/(\w*[\s-])ass(\s\w*)/g);

		// if (assTokens) {
		// 	for (let assToken of assTokens) {
		// 		const fixedAss = assToken.match(/ass(\s\w*)/g)[0].replace(/\s/, '-');
		// 		assMessages.push(fixedAss);
		// 	}
		// }

		// msg.reply(assMessages.join(', '));

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
		return 'That command does not exist!';
	}

	// Check if command needs to be sent in a server
	if (command.guildOnly && msg.channel.type !== 'text') {
		return msg.reply('I can\'t execute that command in a DM.');
	}

	// Check if args are required
	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${msg.author}.`;

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

// Disconnect event
client.on('disconnect', event => {
	console.log('bye bitch', event);
});

// Emoji creation event
client.on('emojiCreate', emoji => {
	// Maybe create a rich embed instead, send a full size version of the emoji?
	const settings = eventHelpers.emojiCreateChannel[emoji.guild.id];
	const emojiChannel = emoji.guild.channels.find(c => c.name === settings.channel);

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
	const settings = eventHelpers.emojiCreateChannel[oldEmoji.guild.id];
	const emojiChannel = oldEmoji.guild.channels.find(c => c.name === settings.channel);

	let message = '';

	if (settings.send_old_emoji || settings.send_new_emoji) {
		if (settings.send_message) {
			message = settings.message_prepend ?
				`${getRandomFromArray(settings.messages)} ${settings.send_old_emoji ? oldEmoji.url : ''}${settings.send_old_emoji && settings.send_new_emoji ? ' -> ' : ''}${settings.send_new_emoji ? newEmoji.url : ''}` :
				`${settings.send_old_emoji ? oldEmoji.url : ''}${settings.send_old_emoji && settings.send_new_emoji ? ' -> ' : ''}${settings.send_new_emoji ? newEmoji.url : ''} ${getRandomFromArray(settings.messages)}`;
		}
		else {
			message = `${settings.send_old_emoji ? oldEmoji.url : ''}${settings.send_old_emoji && settings.send_new_emoji ? ' -> ' : ''}${settings.send_new_emoji ? newEmoji.url : ''}`;
		}

		emojiChannel.send(message);
	}
});

// Message reaction add event (temporarily disabled, causes crashing)
// Enable on a per-guild basis!
client.on('messageReactionAdd', (reaction, user) => {
	// Any other reaction processing goes here:
	// (i.e., giving a user a role on a react; add some stuff to events.js plugin to support this)

	// Auto-alert on react code
	// TODO: Maybe change message out to be a rich embed
	// Get message author, and begin message content
	// const author = reaction.message.author;
	// let message = `${user.tag} reacted to your message,\n> ${reaction.message.content}\nwith `;

	// detect if the emoji is a guild emoji (true) or regular emoji (false), append to message
	// if (typeof reaction.emoji.url !== 'undefined') {
	// 	message += `guild emoji ${reaction.emoji.name} (${reaction.emoji.url})`;
	// }
	// else {
	// 	message += `${reaction.emoji}`;
	// }

	// Send message to author
	// author.send(message);
});

// Rate limiting event
client.on('rateLimit', info => {
	if (DEBUG) console.warn('Rate limiting shit:', info);
});

// Channel creation event (for announcement)
client.on('channelCreate', channel => {
	// Only notify the creation of text and voice channels (when enabled)
	if (channel.type !== 'text' && channel.type !== 'voice' || !eventHelpers.announcements.channel_create.enabled) return;

	// Get channel from eventHelpers.announcements.announcements_channel
	const announcementsChannel = channel.guild.channels.find(c => c.name === eventHelpers.announcements.announcements_channel);

	// Send random message from appropriate messages array + the new channel name to announcements channel
	const message = `${getRandomFromArray(eventHelpers.announcements.channel_create.messages)} ${channel.toString()}`;
	announcementsChannel.send(message);
});

// Channel deletion event (for announcement)
client.on('channelDelete', channel => {
	// Only notify the deletion of text and voice channels (when enabled)
	if (channel.type !== 'text' && channel.type !== 'voice' || !eventHelpers.announcements.channel_delete.enabled) return;

	// Get channel from eventHelpers.announcements.announcements_channel
	const announcementsChannel = channel.guild.channels.find(c => c.name === eventHelpers.announcements.announcements_channel);

	// Send random message from appropriate messages array + the new channel name to announcements channel
	const message = `${getRandomFromArray(eventHelpers.announcements.channel_delete.messages)} #${channel.name}`;
	announcementsChannel.send(message);
});

// Logging events
client.on('error', error => console.error(error));
client.on('warn', warn => console.warn(warn));
if (DEBUG) client.on('debug', info => console.info(info));

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
