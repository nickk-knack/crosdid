// Load .env environment configuration
require('dotenv').config();

// Environment constants
const token = process.env.TOKEN;
const port = process.env.PORT || 3000;
const DEBUG = process.env.DEBUG || false;
const dbFileName = process.env.DB_FILE_NAME || 'db.json';

// Requirements
const winston = require('winston');
const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Discord = require('discord.js');
const randomHex = require('random-hex');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { getRandomFromArray, dbDefaultGuildObj, consoleFormat, fileFormat } = require('./util');

// Configure winston
winston
  .add(new winston.transports.Console({
    format: consoleFormat,
    handleExceptions: true,
  }))
  .add(new winston.transports.File({
    filename: 'error.log',
    level: 'error',
    format: fileFormat,
    handleExceptions: true,
  }))
  .add(new winston.transports.File({
    filename: 'log.log',
    format: fileFormat,
  }))
  .exitOnError = false;

winston.info('Parsed environment variables, loaded requirements, and configured logging');

// Discord.js globals
const client = new Discord.Client();
const cooldowns = new Discord.Collection();
client.commands = new Discord.Collection();
client.winston = winston;

// lowdb setup
const dbDefault = {
  command_prefix: '.',
  global_disabled_cmd_modules: [
    '_translate',
  ],
  operators: [],
  activity_settings: {
    enabled: true,
    type: 'WATCHING',
    text: 'over my children',
  },
  last_username_change_date: 0,
  global_good_count: 0,
  global_bad_count: 0,
  global_thank_count: 0,
  guilds: {},
};

const adapter = new FileSync(dbFileName, {
  defaultValue: dbDefault,
});

const db = low(adapter);
client.db = db;
winston.info(`Loaded local database file from ${dbFileName}`);

const commandModules = fs.readdirSync('./modules');

for (const file of commandModules) {
  // If file is not a .js file or contained in the blacklist, skip it
  if (!file.endsWith('.js')) continue;
  if (db.get('global_disabled_cmd_modules').includes(file.split('.')[0]).value()) continue;

  // Require the command module and set it in the client
  try {
    const command = require(`./modules/${file}`); // eslint-disable-line global-require
    client.commands.set(command.name, command);
  } catch (e) {
    winston.error(`Error loading ${file}: ${e}`);
  }
}

winston.info(`Loaded command modules. Skipped the following: ${db.get('global_disabled_cmd_modules').value().join(', ')}`);

// Ready event
client.once('ready', () => {
  winston.info(`Logged in as: ${client.user.tag}`);

  // Go through joined guilds, make sure there is a per-guild config in db
  for (const g of [...client.guilds.cache.values()]) {
    // Check that the guild is available first
    if (!g.available) continue;

    // Create guild config if non-existent
    const guildExists = db.has(`guilds.${g.id}`).value();
    if (!guildExists) {
      db.set(`guilds.${g.id}`, dbDefaultGuildObj).write();

      g.members.fetch().then((fetched) => {
        fetched.forEach((m) => {
          if (!m.user.bot && !db.get(`guilds.${g.id}.users`).find({ id: m.id }).value()) {
            db.get(`guilds.${g.id}.users`).push({
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
    winston.warn('WARNING: You have no operators listed in db.json, consider adding at least your discord user ID to the operators array.');
  }

  // Set the bot activity text
  const activitySettings = db.get('activity_settings').value();
  if (activitySettings.enabled) {
    client.user
      .setActivity(activitySettings.text, { type: activitySettings.type })
      .catch(winston.error);
  }

  winston.info('Finished loading!');
});

// Message event (command processing)
client.on('message', async (msg) => {
  // Get prefix from db
  const prefix = db.get('command_prefix').value();

  // Command needs to start with prefix
  const prefixRegex = new RegExp(`^(<@!?${client.user.id}> |${prefix})\\s*`, 'u');

  // Test if the message was a command
  if (!prefixRegex.test(msg.content)) {
    // This is a regular message, do any other processing on it

    // Ignore messages from discord/bots (especially yourself), and don't process non-guild messages
    if (msg.system || msg.author.bot || msg.guild === null || !msg.guild.available || msg.webhookID) return;

    // Secret messages & reactions
    const dbUser = db.get(`guilds.${msg.guild.id}.users`).find({ id: msg.author.id });

    // Check that messages are enabled, and that the user has some defined
    const secretMessagesEnabled = db.get(`guilds.${msg.guild.id}.secret_messages.enabled`).value();
    const userSecretMessages = dbUser.get('messages').value();
    if (secretMessagesEnabled && userSecretMessages) {
      // Calculate if we want to send a message
      const secretMessageChance = db.get(`guilds.${msg.guild.id}.secret_messages.chance`).value();
      const sendSecretMessage = Math.random() > (1 - secretMessageChance);

      // Send a random secret mesage
      if (sendSecretMessage) msg.reply(getRandomFromArray(userSecretMessages));
    }

    // Check that reactions are enabled, and that the user has some defined
    const secretReactsEnabled = db.get(`guilds.${msg.guild.id}.secret_reacts.enabled`).value();
    const userSecretReacts = dbUser.get('reactions').value();
    if (secretReactsEnabled && userSecretReacts) {
      // Calculate if we want to react
      const secretReactChance = db.get(`guilds.${msg.guild.id}.secret_reacts.chance`).value();
      const secretlyReact = Math.random() > (1 - secretReactChance);

      // Get random reaction, react with it
      if (secretlyReact) {
        const reaction = getRandomFromArray(userSecretReacts);
        msg.react(reaction.custom ? msg.guild.emojis.cache.get(reaction.emoji) : reaction.emoji);
      }
    }

    // Guild-specific, phrase-activated messages
    const enablePhrases = db.get(`guilds.${msg.guild.id}.enable_phrases`).value();
    if (enablePhrases) {
      const guildPhrases = db.get(`guilds.${msg.guild.id}.phrases`).value();

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

  // Check if the command is in the guild's disabled_cmd_modules list
  if (msg.guild !== null && msg.guild.available) {
    const disabledCmdModules = db.get(`guilds.${msg.guild.id}.disabled_cmd_modules`).value();
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
    await command.execute(msg, args); // might need to make all commands async for this
  } catch (error) {
    winston.error(error.message);
    msg.reply(`an error occurred while executing the \`${commandName}\` command: ${error.message}`);
  } finally {
    msg.channel.stopTyping(true);

    if (msg.guild !== null && msg.guild.available && !command.opOnly) {
      db.set(`guilds.${msg.guild.id}.last_command`, msg.content).write();
    }
  }
});

// Emoji creation event
client.on('emojiCreate', (emoji) => {
  // Return early if this feature is disabled
  const settings = db.get(`guilds.${emoji.guild.id}.announcements.emoji_create`).value();
  if (!settings.enabled) return;

  // Get config from db
  const emojiChannelName = typeof settings.channel_override !== 'undefined' ?
    settings.channel_override : db.get(`guilds.${emoji.guild.id}.announcements.channel`).value();
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
  // Return early if this feature is disabled
  const settings = db.get(`guilds.${emoji.guild.id}.announcements.emoji_delete`).value();
  if (!settings.enabled) return;

  // Get config from db
  const emojiChannelName = typeof settings.channel_override !== 'undefined' ?
    settings.channel_override : db.get(`guilds.${emoji.guild.id}.announcements.channel`).value();
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
  // Return early if this feature is disabled
  const settings = db.get(`guilds.${newEmoji.guild.id}.announcements.emoji_update`).value();
  if (!settings.enabled) return;

  // Get config from db
  const emojiChannelName = typeof settings.channel_override !== 'undefined' ?
    settings.channel_override : db.get(`guilds.${newEmoji.guild.id}.announcements.channel`).value();
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
client.on('messageReactionAdd', async (reaction, user) => {
  // Any other reaction processing goes here:
  // (i.e., giving a user a role on a react)

  // Auto self-100 react
  if (!reaction.me && reaction.emoji == '💯') {
    reaction.message.react('💯');
  }

  // Auto-alert on react code (enabled on a per-guild basis)
  if (typeof reaction.message.guild !== 'undefined' &&
      reaction.message.guild.available &&
      db.get(`guilds.${reaction.message.guild.id}.reaction_notify`).value()) {
    // first check that you can send pms to the author! (i.e. that its not a bot)
    const { author } = reaction.message;
    if (author.bot) return;

    try {
      // Create a DM channel to user
      const dm = await author.createDM();

      // Begin message content
      const embed = new Discord.MessageEmbed()
        .setColor(randomHex.generate())
        .setTitle(`${user.tag} reacted to your message`)
        .addField('Your message', `> ${reaction.message.content}`);

      // detect if the emoji is a guild emoji (true) or regular emoji (false), append to message, send
      if (typeof reaction.emoji.url !== 'undefined') {
        embed
          .setImage(reaction.emoji.url)
          .addField('Reaction', `"${reaction.emoji.name}" from the guild "${reaction.message.guild.name}"`);
      } else {
        embed.addField('Reaction', reaction.emoji);
      }

      dm.send(embed);
    } catch (err) {
      winston.error(`Could not send DM to ${author}. (${err})`);
    }
  }
});

// Channel creation event
client.on('channelCreate', (channel) => {
  // Only notify the creation of text and voice channels
  if (channel.type !== 'text' && channel.type !== 'voice') return;

  // Check if the event is enabled, return otherwise (has to happen after channel type check)
  const settings = db.get(`guilds.${channel.guild.id}.announcements.channel_create`).value();
  if (!settings.enabled) return;

  // Bail if the channel doesn't exist
  const announcementsChannel = channel.guild.channels.cache.find((c) => c.name === db.get(`guilds.${channel.guild.id}.announcements.channel`).value());
  if (typeof announcementsChannel === 'undefined') return winston.error(`The defined announcements channel for guild id ${channel.guild.id} is invalid!`);

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

  // Check if the event is enabled, return otherwise (has to happen after channel type check)
  const settings = db.get(`guilds.${channel.guild.id}.announcements.channel_delete`).value();
  if (!settings.enabled) return;

  // Bail if the channel doesn't exist
  const announcementsChannel = channel.guild.channels.cache.find((c) => c.name === db.get(`guilds.${channel.guild.id}.announcements.channel`).value());
  if (typeof announcementsChannel === 'undefined') return winston.error(`The defined announcements channel for guild id ${channel.guild.id} is invalid!`);

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

  // Check if the event is enabled, return otherwise (has to happen after channel type check)
  const settings = db.get(`guilds.${newChannel.guild.id}.announcements.channel_update`).value();
  if (!settings.enabled) return;

  // Bail if the channel doesn't exist
  const announcementsChannel = newChannel.guild.channels.cache.find((c) => c.name === db.get(`guilds.${newChannel.guild.id}.announcements.channel`).value());
  if (typeof announcementsChannel === 'undefined') return winston.error(`The defined announcements channel for guild id ${newChannel.guild.id} is invalid!`);

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

// Rate limiting event
client.on('rateLimit', (info) => {
  if (DEBUG) winston.warn(`Rate limit: ${info.route}:${info.method} (limit: ${info.limit}, timeout: ${info.timeout}ms)`);
});

// Logging events
client.on('error', (error) => winston.error(error));
client.on('warn', (warn) => winston.warn(warn));
// if (DEBUG) client.on('debug', (info) => winston.info(info));

winston.info('Loaded events');

// Client login
client.login(token);

// Set up express webserver
app.use(bodyParser.json());

app.listen(port, () => {
  winston.info(`Server listening on port ${port}`);
});

app.get('/', (req, res) => {
  res.end('hello crosdid');
});
