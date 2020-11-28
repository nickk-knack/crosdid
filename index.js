// Load .env environment configuration
require('dotenv').config();

// Environment constants
const token = process.env.TOKEN;
const port = process.env.PORT || 3000;
const dbFileName = process.env.DB_FILE_NAME || 'db.json';
const DEBUG = process.env.DEBUG || false;

// Requirements
const winston = require('winston');
const fs = require('fs/promises');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Discord = require('discord.js');
const randomHex = require('random-hex');
const DiscordTransport = require('winston-discordjs');
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const { getRandomFromArray, trim, dbDefault, dbDefaultGuildObj, consoleFormat, fileFormat } = require('./util');

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

// Global database variable
let db = null;

// Async setup
(async () => {
  // Instantiate database, initialize to defaults if nonexistant
  db = await low(new FileAsync(dbFileName));
  await db.defaults(dbDefault).value();

  // Throw an error if the db is still null for some reason
  if (db === null) {
    winston.error('Database was not successfully loaded. Aborting...');
    process.exit(1);
  }

  // Add db to the discord.js client object (for use in commands)
  client.db = db;
  winston.info(`Loaded local database file from ${dbFileName}`);

  // Load command modules
  const commandModules = await fs.readdir('./modules');

  for (const file of commandModules) {
    // If file is not a .js file or contained in the blacklist, skip it
    if (!file.endsWith('.js')) continue;
    const blacklisted = await db.get('global_disabled_cmd_modules').includes(file.split('.')[0]).value();
    if (blacklisted) continue;

    // Require the command module and set it in the client
    try {
      const command = require(`./modules/${file}`); // eslint-disable-line global-require
      client.commands.set(command.name, command);
    } catch (e) {
      winston.error(`Error loading ${file}: ${e.message}`);
    }
  }

  const disabledCmdList = await db.get('global_disabled_cmd_modules').value().join(', ');
  winston.info(`Loaded command modules. Skipped the following: ${disabledCmdList}`);
})();

// Ready event
client.once('ready', async () => {
  winston.info(`Logged in as: ${client.user.tag}`);

  // Go through joined guilds, make sure there is a per-guild config in db
  for (const g of [...client.guilds.cache.values()]) {
    // Check that the guild is available first
    if (!g.available) continue;

    // Create guild config if non-existent
    const guildExists = await db.has(`guilds.${g.id}`).value();
    if (!guildExists) {
      await db.set(`guilds.${g.id}`, dbDefaultGuildObj).write();

      g.members.fetch().then(async (fetched) => {
        fetched.forEach(async (m) => {
          const userExists = await db.get(`guilds.${g.id}.users`).find({ id: m.id }).value();
          if (!m.user.bot && !userExists) {
            await db.get(`guilds.${g.id}.users`).push({
              id: m.id,
              messages: [],
              reactions: [],
              reaction_notify: true,
            }).write();
          }
        });
      });
    }

    // Add winston discord transport if bot_log_channel is not false
    const dbBotLogChannel = await db.get(`guilds.${g.id}.bot_log_channel`).value();
    if (dbBotLogChannel !== false) {
      const botLogChannel = g.channels.cache.find((c) => c.name === dbBotLogChannel);
      if (typeof botLogChannel !== 'undefined' && botLogChannel.type === 'text') {
        winston.add(new DiscordTransport.default({
          discordChannel: botLogChannel,
        }));

        winston.log('info', `Added bot logging transport for the #${botLogChannel.name} channel in the "${g.name}" guild.`);
      } else {
        winston.info(`Could not set "${dbBotLogChannel}" as the bot log channel for the "${g.name}" guild. It may not exist.`);
      }
    }
  }

  // Set the winston object in the client so command modules can use it
  client.winston = winston;

  // Check if there are no operators listed. If so, notify the user
  const operatorCount = await db.get('operators').size().value();
  if (!operatorCount) {
    winston.warn('WARNING: You have no operators listed in db.json, consider adding at least your discord user ID to the operators array.');
  }

  // Set the bot activity text
  const activitySettings = await db.get('activity_settings').value();
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
  const prefix = await db.get('command_prefix').value();

  // Command needs to start with prefix
  const prefixRegex = new RegExp(`^(<@!?${client.user.id}> |${prefix})\\s*`, 'u');

  // Test if the message was a command
  if (!prefixRegex.test(msg.content)) {
    // This is a regular message, do any other processing on it

    // Ignore messages from discord/bots (especially yourself), and don't process non-guild messages
    if (msg.system || msg.author.bot || msg.guild === null || !msg.guild.available || msg.webhookID) return;

    // Secret messages & reactions
    const dbUser = await db.get(`guilds.${msg.guild.id}.users`).find({ id: msg.author.id });

    // Check that messages are enabled, and that the user has some defined
    const secretMessagesEnabled = await db.get(`guilds.${msg.guild.id}.secret_messages.enabled`).value();
    const userSecretMessages = await dbUser.get('messages').value();
    if (secretMessagesEnabled && userSecretMessages) {
      // Calculate if we want to send a message
      const secretMessageChance = await db.get(`guilds.${msg.guild.id}.secret_messages.chance`).value();
      const sendSecretMessage = Math.random() > (1 - secretMessageChance);

      // Send a random secret mesage
      if (sendSecretMessage) msg.reply(getRandomFromArray(userSecretMessages));
    }

    // Check that reactions are enabled, and that the user has some defined
    const secretReactsEnabled = await db.get(`guilds.${msg.guild.id}.secret_reacts.enabled`).value();
    const userSecretReacts = await dbUser.get('reactions').value();
    if (secretReactsEnabled && userSecretReacts) {
      // Calculate if we want to react
      const secretReactChance = await db.get(`guilds.${msg.guild.id}.secret_reacts.chance`).value();
      const secretlyReact = Math.random() > (1 - secretReactChance);

      // Get random reaction, react with it
      if (secretlyReact) {
        const reaction = getRandomFromArray(userSecretReacts);
        try {
          msg.react(reaction.custom ? msg.guild.emojis.cache.get(reaction.emoji) : reaction.emoji);
        } catch (e) {
          winston.error(e.message);
        }
      }
    }

    // Guild-specific, phrase-activated messages
    const enablePhrases = await db.get(`guilds.${msg.guild.id}.enable_phrases`).value();
    if (enablePhrases) {
      const guildPhrases = await db.get(`guilds.${msg.guild.id}.phrases`).value();

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
    const disabledCmdModules = await db.get(`guilds.${msg.guild.id}.disabled_cmd_modules`).value();
    if (disabledCmdModules && disabledCmdModules.includes(command.name)) {
      return msg.reply('that command does not exist!');
    }
  }

  // Check if the user can execute the command (opOnly)
  const isOp = await db.get('operators').includes(msg.author.id).value();
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
  } catch (e) {
    winston.error(e.message);
    msg.reply(`an error occurred while executing the \`${commandName}\` command: ${e.message}`);
  } finally {
    msg.channel.stopTyping(true);

    if (msg.guild !== null && msg.guild.available && !command.opOnly) {
      db.set(`guilds.${msg.guild.id}.last_command`, msg.content).write();
    }
  }
});

// Emoji creation event
client.on('emojiCreate', async (emoji) => {
  // Return early if this feature is disabled
  const settings = await db.get(`guilds.${emoji.guild.id}.announcements.emoji_create`).value();
  if (!settings.enabled) return;

  // Get config from db
  const emojiChannelName = typeof settings.channel_override !== 'undefined' ?
    settings.channel_override : await db.get(`guilds.${emoji.guild.id}.announcements.channel`).value();
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
client.on('emojiDelete', async (emoji) => {
  // Return early if this feature is disabled
  const settings = await db.get(`guilds.${emoji.guild.id}.announcements.emoji_delete`).value();
  if (!settings.enabled) return;

  // Get config from db
  const emojiChannelName = typeof settings.channel_override !== 'undefined' ?
    settings.channel_override : await db.get(`guilds.${emoji.guild.id}.announcements.channel`).value();
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
client.on('emojiUpdate', async (oldEmoji, newEmoji) => {
  // Return early if this feature is disabled
  const settings = await db.get(`guilds.${newEmoji.guild.id}.announcements.emoji_update`).value();
  if (!settings.enabled) return;

  // Get config from db
  const emojiChannelName = typeof settings.channel_override !== 'undefined' ?
    settings.channel_override : await db.get(`guilds.${newEmoji.guild.id}.announcements.channel`).value();
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

  // Reaction notifications
  const { author, guild } = reaction.message;
  const guildReactionNotifyEnabled = await db.get(`guilds.${guild.id}.reaction_notify`).value();
  if (typeof guild !== 'undefined' && guild.available && guildReactionNotifyEnabled) {
    // first check that you can send pms to the author! (i.e. that its not a bot)
    if (author.bot) return;

    // then, check if the user has reaction_notify enabled
    const userReactionNotifyEnabled = await db.get(`guilds.${guild.id}.users`).find({ id: author.id }).get('reaction_notify').value();
    if (!userReactionNotifyEnabled) return;

    try {
      // Create a DM channel to user
      const dm = await author.createDM();

      // Begin message content
      const embed = new Discord.MessageEmbed()
        .setColor(randomHex.generate())
        .setTitle(`${user.tag} reacted to your message`)
        .addField('Your message', `> ${trim(reaction.message.content, 1024)}`)
        .addField('Reaction', `"${reaction.emoji}" from the "${reaction.message.guild.name}" guild.`);

      dm.send(embed);
    } catch (e) {
      winston.error(`Could not send DM to ${author}. (${e.message})`);
    }
  }
});

// Channel creation event
client.on('channelCreate', async (channel) => {
  // Only notify the creation of text and voice channels
  if (channel.type !== 'text' && channel.type !== 'voice') return;

  // Check if the event is enabled, return otherwise (has to happen after channel type check)
  const settings = await db.get(`guilds.${channel.guild.id}.announcements.channel_create`).value();
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
client.on('channelDelete', async (channel) => {
  // Only notify the deletion of text and voice channels
  if (channel.type !== 'text' && channel.type !== 'voice') return;

  // Check if the event is enabled, return otherwise (has to happen after channel type check)
  const settings = await db.get(`guilds.${channel.guild.id}.announcements.channel_delete`).value();
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
client.on('channelUpdate', async (oldChannel, newChannel) => {
  // Only notify the deletion of text and voice channels (when enabled)
  if (newChannel.type !== 'text' && newChannel.type !== 'voice') return;

  // Check if the event is enabled, return otherwise (has to happen after channel type check)
  const settings = await db.get(`guilds.${newChannel.guild.id}.announcements.channel_update`).value();
  if (!settings.enabled) return;

  // Bail if the channel doesn't exist
  const announcementsChannelName = await db.get(`guilds.${newChannel.guild.id}.announcements.channel`).value();
  const announcementsChannel = newChannel.guild.channels.cache.find((c) => c.name === announcementsChannelName);
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
  winston.warn(`Rate limit: ${info.route}:${info.method} (limit: ${info.limit}, timeout: ${info.timeout}ms)`);
});

// Logging events
client.on('error', (error) => winston.error(error));
client.on('warn', (warn) => winston.warn(warn));
if (DEBUG) client.on('debug', (info) => winston.info(info));

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
