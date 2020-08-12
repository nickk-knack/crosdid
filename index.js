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
const randomHex = require('random-hex');

// Environment constants
const token = process.env.TOKEN;
const port = process.env.PORT || 3000;
const DEBUG = process.env.PRINT_DEBUG || false;
const dbFileName = process.env.DB_FILE_NAME || 'db.json';

// Extra functions
const getRandomFromArray = (array) => array[Math.floor(Math.random() * array.length)];

// Start of the main bot code
console.log('Starting bot...');

// Discord.js globals
const client = new Discord.Client({
  disabledEvents: ['TYPING_START'],
});
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

// lowdb setup
const dbDefault = {
  globalDisabledCmdModules: [
    'reddit',
  ],
  operators: [],
  activitySettings: {
    enabled: true,
    type: 'WATCHING',
    text: 'over my children',
    url: '',
  },
  good_count: 0,
  bad_count: 0,
  thank_count: 0,
};

// this is a cheesy change, requires that this plugin always be included...
// however, it prevents duplicate code so yay -~40 lines from this file
const { dbDefaultGuildObj } = require('./modules/bot.js');

const adapter = new FileSync(dbFileName, {
  defaultValue: dbDefault,
});

const db = low(adapter);
client.db = db;
console.log(`Loaded local database file from ${dbFileName}`);

// Get prefix from db
const prefix = db.get('commandPrefix').value();

// Load in all command modules
console.log('\tLoading command modules...');

const commandModules = fs.readdirSync('./modules');

for (const file of commandModules) {
  // If file is not a .js file or contained in the blacklist, skip it
  if (!file.endsWith('.js')) continue;
  if (db.get('globalDisabledCmdModules').includes(file.split('.')[0]).value()) continue;

  // Require the command module and set it in the client
  try {
    const command = require(`./modules/${file}`); // eslint-disable-line global-require
    client.commands.set(command.name, command);
  } catch (e) {
    console.error(`Error loading ${file}: `, e);
  }
}

console.log(`\t\tCommand modules loaded. Skipped the following: ${db.get('globalDisabledCmdModules').value().join(', ')}.`);

// Events
console.log('\tLoading events...');

// Ready event
client.once('ready', () => {
  console.log(`\tLogged in as ${client.user.tag}!`);

  // Go through joined guilds, make sure there is a per-guild config in db
  for (const g of [...client.guilds.cache.values()]) {
    // Check that the guild is available first
    if (!g.available) continue;

    // Create guild config if non-existent
    if (!db.has(g.id).value()) {
      db.set(g.id, dbDefaultGuildObj).write();

      g.members.fetch().then((fetched) => {
        fetched.forEach((m) => {
          if (!m.user.bot && !db.get(`${g.id}.users`).find({ id: m.id }).value()) {
            db.get(`${g.id}.users`).push({
              id: m.id,
              messages: [],
              reactions: [],
            }).write();
          }
        });
      });
    }
  }

  // Check if there are no operators listed. If so, notify the user
  if (!db.get('operators').size().value()) {
    console.log('WARNING: You have no operators listed in db.json, consider adding at least your discord user ID to the operators array.');
  }

  // Set the bot activity text
  const activitySettings = db.get('activitySettings').value();
  if (activitySettings.enabled) {
    client.user
      .setActivity(activitySettings.text, { type: activitySettings.type })
      .catch(console.error);
  }

  console.log('Finished loading!');
});

// Message event (command processing)
client.on('message', async (msg) => {
  // Command needs to start with prefix
  const prefixRegex = new RegExp(`^(<@!?${client.user.id}> |\\${prefix})\\s*`, 'u');

  // Test if the message was a command
  if (!prefixRegex.test(msg.content)) {
    // This is a regular message, do any other processing on it

    // Ignore messages from discord/bots (especially yourself), and don't process non-guild messages
    if (msg.system || msg.author.bot || msg.guild === null || !msg.guild.available || msg.webhookID) return;

    // Secret messages & reactions
    const dbUser = db.get(`${msg.guild.id}.users`).find({ id: msg.author.id });

    // Check that messages are enabled, and that the user has some defined
    const secretMessagesEnabled = db.get(`${msg.guild.id}.secret_messages.enabled`).value();
    const userSecretMessages = dbUser.get('messages').value();
    if (secretMessagesEnabled && userSecretMessages) {
      // Calculate if we want to send a message
      const secretMessageChance = db.get(`${msg.guild.id}.secret_messages.chance`).value();
      const sendSecretMessage = Math.random() > (1 - secretMessageChance);

      // Send a random secret mesage
      if (sendSecretMessage) msg.reply(getRandomFromArray(userSecretMessages));
    }

    // Check that reactions are enabled, and that the user has some defined
    const secretReactsEnabled = db.get(`${msg.guild.id}.secret_reacts.enabled`).value();
    const userSecretReacts = dbUser.get('reactions').value();
    if (secretReactsEnabled && userSecretReacts) {
      // Calculate if we want to react
      const secretReactChance = db.get(`${msg.guild.id}.secret_reacts.chance`).value();
      const secretlyReact = Math.random() > (1 - secretReactChance);

      // Get random reaction, react with it
      if (secretlyReact) {
        const reaction = getRandomFromArray(userSecretReacts);
        msg.react(reaction.custom ? msg.guild.emojis.cache.get(reaction.emoji) : reaction.emoji);
      }
    }

    // Guild-specific, phrase-activated messages
    const enablePhrases = db.get(`${msg.guild.id}.enablePhrases`).value();
    if (enablePhrases) {
      const guildPhrases = db.get(`${msg.guild.id}.phrases`).value();

      if (typeof guildPhrases !== 'undefined') {
        for (const guildPhrase of guildPhrases) {
          const triggerRegex = new RegExp(guildPhrase.trigger, 'giu');

          if (triggerRegex.test(msg.content) && guildPhrase.responses) {
            msg.channel.send(getRandomFromArray(guildPhrase.responses));
          }
        }
      }
    }

    // Ass-fixer
    const assMessages = [];
    const assTokens = msg.content.match(/\w*[\s-]ass\s\w*/giu);
    if (assTokens && assTokens !== null) {
      for (const assToken of assTokens) {
        const fixedAss = assToken.match(/ass\s\w*/gu)[0].replace(/\s/u, '-');
        assMessages.push(fixedAss);
      }
    }

    if (assMessages.length > 0) msg.reply(assMessages.join(', '));

    // At the end, return.
    return;
  }

  // Get command args and command name
  const [, matchedPrefix] = msg.content.match(prefixRegex);
  const args = msg.content.slice(matchedPrefix.length).split(/\s+/gu);
  const commandName = args.shift().toLowerCase();

  // Get the actual command object, check if it exists
  const command = client.commands.get(commandName) || client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));
  if (!command) {
    return msg.reply('that command does not exist!');
  }

  // Check if the command is in the guild's disabledCmdModules list
  if (msg.guild !== null && msg.guild.available) {
    const disabledCmdModules = db.get(`${msg.guild.id}.disabledCmdModules`).value();
    if (disabledCmdModules && disabledCmdModules.includes(command.name)) {
      return msg.reply('that command does not exist!');
    }
  }

  // Check if the user can execute the command (opOnly)
  const isOp = db.get('operators').includes(msg.author.id).value();
  if (command.opOnly && !isOp) {
    return msg.reply('you do not have permission to execute that command!');
  }

  // Check if command needs to be sent in a server
  if (command.guildOnly && msg.channel.type !== 'text') {
    return msg.reply('I can\'t execute that command in a DM.');
  }

  // Check if args are required, or if not enough args are passed
  if (command.args && (!args.length || command.minArgsLength > args.length)) {
    let reply = `you didn't provide ${command.minArgsLength > args.length ? 'enough' : 'any'} arguments.`;

    if (command.usage) {
      reply += `\nProper usage: "${prefix}${command.name} ${command.usage}"`;
    }

    return msg.reply(reply);
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
  } else {
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
    msg.channel.startTyping();
    command.execute(msg, args);
  } catch (error) {
    console.error(error);
    msg.reply(`an error occurred while executing the \`${commandName}\` command: ${error.message}`);
  } finally {
    msg.channel.stopTyping(true);
  }
});

// Emoji creation event
client.on('emojiCreate', (emoji) => {
  // Access db for event settings
  const settings = db.get(`${emoji.guild.id}.announcements.emoji_create`).value();

  // Return early if this feature is disabled
  if (!settings.enabled) return;

  // Get config from db
  const emojiChannelName = typeof settings.channel_override !== 'undefined' ?
    settings.channel_override : db.get(`${emoji.guild.id}.announcements.channel`).value();
  const emojiChannel = emoji.guild.channels.cache.find((c) => c.name === emojiChannelName);
  const title = settings.messages.length ? getRandomFromArray(settings.messages) : 'Emoji Created';

  // Create and send embed, then react to the message with the emoji
  const embed = new Discord.MessageEmbed()
    .setColor(randomHex.generate())
    .setImage(emoji.url)
    .setTitle(title)
    .setFooter(emoji.name);

  emojiChannel.send(embed).then((message) => message.react(emoji));
});

// Emoji delete event
client.on('emojiDelete', (emoji) => {
  // Access db for event settings
  const settings = db.get(`${emoji.guild.id}.announcements.emoji_delete`).value();

  // Return early if this feature is disabled
  if (!settings.enabled) return;

  // Get config from db
  const emojiChannelName = typeof settings.channel_override !== 'undefined' ?
    settings.channel_override : db.get(`${emoji.guild.id}.announcements.channel`).value();
  const emojiChannel = emoji.guild.channels.cache.find((c) => c.name === emojiChannelName);
  const title = settings.messages.length ? getRandomFromArray(settings.messages) : 'Emoji Deleted';

  // Create and send embed
  const embed = new Discord.MessageEmbed()
    .setColor(randomHex.generate())
    .setImage(emoji.url)
    .setTitle(title)
    .setFooter(emoji.name);

  emojiChannel.send(embed);
});

// Emoji update event
client.on('emojiUpdate', (oldEmoji, newEmoji) => {
  // Access db for event settings
  const settings = db.get(`${newEmoji.guild.id}.announcements.emoji_update`).value();

  // Return early if this feature is disabled
  if (!settings.enabled) return;

  // Get config from db
  const emojiChannelName = typeof settings.channel_override !== 'undefined' ?
    settings.channel_override : db.get(`${newEmoji.guild.id}.announcements.channel`).value();
  const emojiChannel = newEmoji.guild.channels.cache.find((c) => c.name === emojiChannelName);
  const title = settings.messages.length ? getRandomFromArray(settings.messages) : 'Emoji Updated';

  // Create and send embed, then react to the message with the emoji
  const embed = new Discord.MessageEmbed()
    .setColor(randomHex.generate())
    .setImage(newEmoji.url)
    .addField('Old Emoji', `**[${oldEmoji.name}](${oldEmoji.url})**`, true)
    .addField('New Emoji', `**[${newEmoji.name}](${newEmoji.url})**`, true)
    .setTitle(title);

  emojiChannel.send(embed).then((message) => message.react(newEmoji));
});

// Message reaction add event
client.on('messageReactionAdd', (reaction, user) => {
  // Any other reaction processing goes here:
  // (i.e., giving a user a role on a react)

  // Auto self-100 react
  if (!reaction.me && reaction.emoji == '💯') {
    reaction.message.react('💯');
  }

  // Auto-alert on react code (enabled on a per-guild basis)
  if (typeof reaction.message.guild !== 'undefined' &&
      reaction.message.guild.available &&
      db.get(`${reaction.message.guild.id}.reactionNotify`).value()) {
    // first check that you can send pms to the author! (i.e. that its not a bot)
    if (reaction.message.author.bot) return;

    // Get message author, and begin message content
    const { author } = reaction.message;
    const embed = new Discord.MessageEmbed()
      .setColor(randomHex.generate())
      .setTitle(`${user.tag} reacted to your message`)
      .addField('Your message', `> ${reaction.message.content}`);

    // detect if the emoji is a guild emoji (true) or regular emoji (false), append to message
    if (typeof reaction.emoji.url !== 'undefined') {
      embed.setImage(reaction.emoji.url)
        .addField('Reaction', `"${reaction.emoji.name}" from guild "${reaction.message.guild.name}"`);
    } else {
      embed.addField('Reaction', reaction.emoji);
    }

    // Send message to author
    author.send(embed);
  }
});

// Rate limiting event
client.on('rateLimit', (info) => {
  if (DEBUG) console.warn(`Rate limit: ${info.limit} (td: ${info.timeDifference}ms)`, `[${info.method}]:[${info.path}]:[${info.route}]`);
});

// Channel creation event
client.on('channelCreate', (channel) => {
  // Only notify the creation of text and voice channels
  if (channel.type !== 'text' && channel.type !== 'voice') return;

  // Get settings for this event from the db
  const settings = db.get(`${channel.guild.id}.announcements.channel_create`).value();

  // Check if the event is enabled, return otherwise (has to happen after channel type check)
  if (!settings.enabled) return;

  // Get a reference to the defined announcements channel
  const announcementsChannel = channel.guild.channels.cache.find((c) => c.name === db.get(`${channel.guild.id}.announcements.channel`).value());

  // Bail if the channel doesn't exist
  if (typeof announcementsChannel === 'undefined') return console.error(`The defined announcements channel for guild id ${channel.guild.id} is invalid!`);

  // Send random message from appropriate messages array + the new channel name to announcements channel
  const title = settings.messages.length ? getRandomFromArray(settings.messages) : 'Channel Created';

  const embed = new Discord.MessageEmbed()
    .setColor(randomHex.generate())
    .setTitle(title)
    .setDescription(channel);

  announcementsChannel.send(embed);
});

// Channel deletion event
client.on('channelDelete', (channel) => {
  // Only notify the deletion of text and voice channels
  if (channel.type !== 'text' && channel.type !== 'voice') return;

  // Get settings for this event from the db
  const settings = db.get(`${channel.guild.id}.announcements.channel_delete`).value();

  // Check if the event is enabled, return otherwise (has to happen after channel type check)
  if (!settings.enabled) return;

  // Get a reference to the defined announcements channel
  const announcementsChannel = channel.guild.channels.cache.find((c) => c.name === db.get(`${channel.guild.id}.announcements.channel`).value());

  // Bail if the channel doesn't exist
  if (typeof announcementsChannel === 'undefined') return console.error(`The defined announcements channel for guild id ${channel.guild.id} is invalid!`);

  // Send random message from appropriate messages array + the old channel name to announcements channel
  const title = settings.messages.length ? getRandomFromArray(settings.messages) : 'Channel Deleted';

  const embed = new Discord.MessageEmbed()
    .setColor(randomHex.generate())
    .setTitle(title)
    .setDescription(channel);

  announcementsChannel.send(embed);
});

// Channel update event
client.on('channelUpdate', (oldChannel, newChannel) => {
  // Only notify the deletion of text and voice channels (when enabled)
  if (newChannel.type !== 'text' && newChannel.type !== 'voice') return;

  // Get settings for this event from the db
  const settings = db.get(`${newChannel.guild.id}.announcements.channel_update`).value();

  // Check if the event is enabled, return otherwise (has to happen after channel type check)
  if (!settings.enabled) return;

  // Get a reference to the defined announcements channel
  const announcementsChannel = newChannel.guild.channels.cache.find((c) => c.name === db.get(`${newChannel.guild.id}.announcements.channel`).value());

  // Bail if the channel doesn't exist
  if (typeof announcementsChannel === 'undefined') return console.error(`The defined announcements channel for guild id ${newChannel.guild.id} is invalid!`);

  // Send random message from appropriate messages array + a bunch of updated info for the old->new channel
  const title = settings.messages.length ? getRandomFromArray(settings.messages) : 'Channel Updated';

  // Future Todo: find specific differences between old and new channel (for both text and voice channels) and add fields for each
  const embed = new Discord.MessageEmbed()
    .setColor(randomHex.generate())
    .setTitle(title)
    .addField('Old Channel', `${oldChannel}${oldChannel.type === 'text' ? `\n"${oldChannel.topic}"` : ''}`, true)
    .addField('New Channel', `${newChannel}${newChannel.type === 'text' ? `\n"${newChannel.topic}"` : ''}`, true);

  announcementsChannel.send(embed);
});

// Logging events
client.on('error', (error) => console.error(error));
client.on('warn', (warn) => console.warn(warn));
// if (DEBUG) client.on('debug', (info) => console.info(info));
process.on('uncaughtException', (error) => console.error(error));

console.log('\t\tEvents loaded.');

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
