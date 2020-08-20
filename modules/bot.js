const { MessageEmbed } = require('discord.js');
const randomHex = require('random-hex');
const { stripIndent } = require('common-tags');

const validActivities = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING'];
const validAnnouncements = ['channel_create', 'channel_delete', 'channel_update', 'emoji_create', 'emoji_delete', 'emoji_update'];
const overrideableAnnouncements = ['emoji_create', 'emoji_delete', 'emoji_update'];

const dbDefaultGuildObj = {
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
    channel_update: {
      enabled: false,
      messages: [],
    },
    emoji_create: {
      enabled: false,
      channel_override: '',
      messages: [],
    },
    emoji_delete: {
      enabled: false,
      channel_override: '',
      messages: [],
    },
    emoji_update: {
      enabled: false,
      channel_override: '',
      messages: [],
    },
  },
  good_count: 0,
  bad_count: 0,
  thank_count: 0,
};

module.exports.dbDefaultGuildObj = dbDefaultGuildObj;

module.exports = {
  name: 'bot',
  description: 'Modify various bot settings on the fly. Use the help subcommand for further help.',
  usage: `help [subcommand] |
      activity <...> |
      phrases <...> |
      avatar <...> |
      username <...> |
      secret <...> |
      reactionNotify <...> |
      update <...> |
      announcements <...>`,
  args: true,
  minArgsLength: 2,
  guildOnly: true,
  opOnly: true,
  cooldown: 1,
  execute(message, args) {
    const { db } = message.client;
    const subcommand = args.shift().toLowerCase();
    const subcommandArg = args.shift().toLowerCase();

    if (subcommand === 'help') {
      const prefix = db.get('command_prefix').value() || message.client.user.toString();
      let msg = `\n${prefix}${module.exports.name} `;

      switch (subcommandArg) {
        case 'help':
          msg += 'help <activity | phrases | avatar | secret | reactionNotify | update | annoucnements | help>';
          break;
        case 'activity':
          msg += stripIndent`activity <enable> |
                        <disable> |
                        <type <playing | streaming | listening | watching>> |
                        <text <activity text>>`;
          break;
        case 'phrases':
          msg += stripIndent`phrases <enable> |
                        <disable> |
                        <list> |
                        <addtrigger <trigger>> |
                        <addresponse <trigger index> <response>> |
                        <removetrigger <trigger index>> |
                        <removeresponse <trigger index> <response index>>`;
          break;
        case 'avatar':
          msg += 'avatar <get | set <image url>>';
          break;
        case 'username':
          msg += 'username <new username>';
          break;
        case 'secret':
          msg += 'secret <messages | reacts> <enable | disable | chance <get | 0.0 - 1.0>>';
          break;
        case 'reactionNotify':
          msg += 'reactionNotify <enable | disable>';
          break;
        case 'update':
          msg += 'update <guilds | users>';
          break;
        case 'announcements':
          msg += stripIndent`announcements <channel <announcement_channel_name>> |
                                      <enable | disable <channel_create |
                                                                        channel_delete |
                                                                        channel_update |
                                                                        emoji_create |
                                                                        emoji_delete |
                                                                        emoji_update>> |
                                      <addmessage <channel_create |
                                                                    channel_delete |
                                                                    channel_update |
                                                                    emoji_create |
                                                                    emoji_delete |
                                                                    emoji_update> <message>> |
                                      <overridechan <emoji_create |
                                                                    emoji_delete |
                                                                    emoji_update> <emoji_channel_name>>`;
          break;
        default:
          msg = `unknown subcommand: ${subcommandArg}`;
          break;
      }

      return message.reply(msg);
    } else if (subcommand === 'activity') {
      switch (subcommandArg) {
        case 'enable':
          db.set('activity_settings.enabled', true).write();
          message.reply('successfully **enabled** the bot\'s activity message.');
          break;
        case 'disable':
          db.set('activity_settings.enabled', false).write();
          message.reply('successfully **disabled** the bot\'s activity message.');
          break;
        case 'type': {
          if (!args.length) return message.reply('you did not provide enough arguments to execute that command!');
          const type = args.shift().toUpperCase();
          if (!validActivities.includes(type)) return message.reply(`invalid activity type: "${type}"`);

          db.set('activity_settings.type', type).write();

          message.reply(`successfully set the bot's activity type to "${type}".`);
          break;
        }
        case 'text': {
          if (!args.length) return message.reply('you did not provide enough arguments to execute that command!');
          const text = args.join(' ').trim();
          db.set('activity_settings.text', text).write();

          message.reply(`successfully set the bot's activity text to "${text}".`);
          break;
        }
        default:
          return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: enable, disable, type, text)`);
      }

      const activitySettings = db.get('activity_settings').value();

      if (activitySettings.enabled) {
        message.client.user.setActivity(activitySettings.text, { type: activitySettings.type })
          .catch((e) => {
            console.error(e);
            message.reply('there was an error setting the activity. Check the console for debugging information.');
          });
      } else {
        message.client.user.setActivity(null)
          .catch((e) => {
            console.error(e);
            message.reply('there was an error setting the activity. Check the console for debugging information.');
          });
      }
    } else if (subcommand === 'phrases') {
      if (!args.length && subcommandArg !== 'list') return message.reply('you did not provide enough arguments to execute that command!');

      const dbPhrases = db.get(`${message.guild.id}.phrases`);

      switch (subcommandArg) {
        case 'enable':
        case 'e':
          db.set(`${message.guild.id}.enablePhrases`, true);
          return message.reply('successfully **enabled** trigger phrases for the guild.');
        case 'disable':
        case 'd':
          db.set(`${message.guild.id}.enablePhrases`, false);
          return message.reply('successfully **disabled** trigger phrases for the guild.');
        case 'list':
        case 'l': {
          const embed = new MessageEmbed().setColor(randomHex.generate());
          let i = -1;

          for (const phrase of dbPhrases.value()) {
            embed.addField(`[Trigger ${++i}]: **${phrase.trigger}**`, `Responses: [\n${phrase.responses.map((r) => `\t"${r}"`).join(',\n')}\n]`, true);
          }

          return message.reply(`secret phrases for ${message.guild.name}:`, embed);
        }
        case 'addtrigger':
        case 'at': {
          const triggerPhrase = args.join(' ');
          if (dbPhrases.find({ trigger: triggerPhrase }).value()) return message.reply(`"${triggerPhrase}" already exists!`);

          dbPhrases.push({
            trigger: triggerPhrase,
            responses: [],
          }).write();

          return message.reply(`successfully added trigger phrase: "${triggerPhrase}" (index: ${dbPhrases.size().value() - 1}).`);
        }
        case 'addresponse':
        case 'ar': {
          const triggerIndex = parseInt(args.shift(), 10);
          if (isNaN(triggerIndex) || triggerIndex >= dbPhrases.size().value()) return message.reply(`${triggerIndex} is out of bounds! [must be 0 - ${dbPhrases.size().value() - 1}]`);

          const dbPhraseObject = dbPhrases.get(triggerIndex);
          const dbPhraseResponses = dbPhraseObject.get('responses');
          const responsePhrase = args.join(' ');
          if (dbPhraseResponses.includes(responsePhrase).value()) return message.reply(`${responsePhrase} already exists for the given trigger index!`);

          dbPhraseResponses.push(responsePhrase).write();

          return message.reply(`successfully added response phrase "${responsePhrase}" for trigger "${dbPhraseObject.get('trigger').value()}".`);
        }
        case 'removetrigger':
        case 'rt': {
          const triggerIndex = parseInt(args.shift(), 10);
          if (isNaN(triggerIndex) || triggerIndex >= dbPhrases.size().value()) return message.reply(`${triggerIndex} is out of bounds! [must be 0 - ${dbPhrases.size().value() - 1}]`);

          const removed = dbPhrases.pullAt(triggerIndex).write();
          return message.reply(`successfully removed "${removed[0].trigger}" as a trigger.`);
        }
        case 'removeresponse':
        case 'rr': {
          const triggerIndex = parseInt(args.shift(), 10);
          if (isNaN(triggerIndex) || triggerIndex >= dbPhrases.size().value()) return message.reply(`${triggerIndex} is out of bounds! [must be 0 - ${dbPhrases.size().value() - 1}]`);

          const dbPhraseObject = dbPhrases.get(triggerIndex);
          const dbPhraseResponses = dbPhraseObject.get('responses');
          const responseIndex = parseInt(args.shift(), 10);
          if (isNaN(responseIndex) || responseIndex >= dbPhraseResponses.size().value()) return message.reply(`${responseIndex} is out of bounds! [must be 0 - ${dbPhraseResponses.size().value() - 1}]`);

          const removed = dbPhraseResponses.pullAt(responseIndex).write();
          return message.reply(`successfully removed "${removed}" from the responses for "${dbPhraseObject.get('trigger').value()}".`);
        }
        default:
          return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: enable, disable, list, addtrigger, addresponse, removetrigger, removeresponse)`);
      }
    } else if (subcommand === 'avatar') {
      switch (subcommandArg) {
        case 'set': {
          if (!args.length) return message.reply('you did not provide enough arguments to execute that command!');
          const avatarUrl = args.join(' ').trim();

          // This actually might be incredibly unsafe, since I'm not sanity checking the url.
          // It's possible that the url can be a path to a local file,
          // and that would be perfectly valid in this case.
          message.client.user.setAvatar(avatarUrl)
            .then(() => message.reply(`successfully set avatar to ${avatarUrl}`))
            .catch((e) => {
              console.error(e);
              message.reply('there was an error setting the avatar. Check the console for debugging information.');
            });
          break;
        }
        case 'get':
          return message.reply(
            message.client.user.avatarURL({
              dynamic: true,
              format: 'png',
              size: 1024,
            }));
        default:
          return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: get, set)`);
      }
    } else if (subcommand === 'username') {
      // note: this requires the bot to restart for change to be effective
      const now = (new Date()).valueOf();
      const lastUsernameChangeDate = db.get('last_username_change_date').value();
      const timeDiff = now - lastUsernameChangeDate;

      if (timeDiff > (30 * 60 * 1000)) {
        message.client.user.setUsername(subcommandArg);
        db.set('last_username_change_date', now).write();
        return message.reply(`successfully set bot's username to ${subcommandArg}`);
      } else {
        return message.reply(`you cannot change the bot's username for another ${30 - (timeDiff / 1000 / 60)} minutes.`);
      }
    } else if (subcommand === 'secret') {
      // Check that the subcommandArg is valid
      if (subcommandArg !== 'messages' && subcommandArg !== 'reacts') {
        return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: messages, reacts)`);
      }

      // Get the mode from the next arg, check that it is valid
      const mode = args.shift().toLowerCase();
      if (mode !== 'enable' && mode !== 'disable' && mode !== 'chance') {
        return message.reply(`\`${mode}\` is not valid! (Expected: enable, disable, chance)`);
      }

      // Get the setting from the next arg, set the reply message
      let setting = '';
      let msgReply = '';

      if (mode === 'enable') {
        setting = true;
        msgReply = `successfully **enabled** secret ${subcommandArg}.`;
      } else if (mode === 'disable') {
        setting = false;
        msgReply = `successfully **disabled** secret ${subcommandArg}.`;
      } else if (mode === 'chance') {
        setting = args.shift();
        if (setting === 'get') {
          return message.reply(`chance for secret ${subcommandArg}: ${db.get(`${message.guild.id}.secret_${subcommandArg}.${mode}`).value()}`);
        }

        setting = parseFloat(setting);
        if (isNaN(setting)) return message.reply(`${setting} is invalid! Expected a float between 0.0 and 1.0`);

        msgReply = `successfully set chance for secret ${subcommandArg} to ${setting}.`;
      }

      // Write new setting to db, return and reply to message
      db.set(`${message.guild.id}.secret_${subcommandArg}.${mode}`, setting).write();
      return message.reply(msgReply);
    } else if (subcommand === 'reactionNotify') {
      switch (subcommandArg) {
        case 'enable':
          db.set(`${message.guild.id}.${subcommand}`, true).write();
          return message.reply('successfully **enabled** reaction notification for the guild.');
        case 'disable':
          db.set(`${message.guild.id}.${subcommand}`, false).write();
          return message.reply('successfully **disabled** reaction notification for the guild.');
        default:
          return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: enable, disable)`);
      }
    } else if (subcommand === 'update') {
      switch (subcommandArg) {
        case 'guilds': {
          const guildsAdded = [];

          // Go through joined guilds, make sure there is a per-guild config in db
          for (const g of [...message.client.guilds.cache.values()]) {
            // Check that the guild is available first
            if (!g.available) continue;

            // Create guild config if non-existent
            if (!db.has(g.id).value()) {
              db.set(g.id, dbDefaultGuildObj).write();
              guildsAdded.push(g.name);
            }
          }

          return message.reply(`successfully updated all guild db information!${guildsAdded.length ? ` ${guildsAdded.length} guilds added: ${guildsAdded.join(', ')}` : ''}`);
        }
        case 'users': {
          const usersAdded = [];

          // go through all users in current guild, add shit to db for them
          message.guild.members.fetch().then((fetched) => {
            fetched.forEach((m) => {
              if (!m.user.bot && !db.get(`${message.guild.id}.users`).find({ id: m.id }).value()) {
                db.get(`${message.guild.id}.users`).push({
                  id: m.id,
                  messages: [],
                  reactions: [],
                }).write();

                usersAdded.push(m.user.username);
              }
            });
          });

          return message.reply(`successfully updated user db information for current guild!${usersAdded.length ? ` ${usersAdded.length} users added: ${usersAdded.join(', ')}` : ''}`);
        }
        default:
          return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: guilds, users)`);
      }
    } else if (subcommand === 'announcements') {
      if (!args.length) return message.reply('you did not provide enough arguments to execute that command!');

      switch (subcommandArg) {
        case 'channel': {
          const channelName = args.shift();
          if (message.guild.channels.cache.find((c) => c.name === channelName) === null) return message.reply(`${channelName} does not exist in this guild!`);

          db.set(`${message.guild.id}.announcements.channel`, channelName).write();
          return message.reply(`successfully set the announcements channel to #${channelName}`);
        }
        case 'enable': {
          const announcement = args.shift().toLowerCase();
          if (!validAnnouncements.includes(announcement)) return message.reply(`invalid announcement event: ${announcement}`);

          db.set(`${message.guild.id}.announcements.${announcement}.enabled`, true);
          return message.reply(`successfully enabled the \`${announcement}\` event for this guild.`);
        }
        case 'disable': {
          const announcement = args.shift().toLowerCase();
          if (!validAnnouncements.includes(announcement)) return message.reply(`invalid announcement event: ${announcement}`);

          db.set(`${message.guild.id}.announcements.${announcement}.enabled`, false);
          return message.reply(`successfully disabled the \`${announcement}\` event for this guild.`);
        }
        case 'addmessage': {
          const announcement = args.shift().toLowerCase();
          if (!validAnnouncements.includes(announcement)) return message.reply(`invalid announcement event: ${announcement}`);

          if (!args.length) return message.reply("you didn't provide a message to be added!");
          const newMessage = args.join(' ');
          if (/^\s+$/giu.test(newMessage)) return message.reply(`your message can't be empty! ("${newMessage}")`);

          db.get(`${message.guild.id}.announcements.${announcement}.messages`).push(newMessage).write();
          return message.reply(`successfully added "${newMessage}" as a message for the ${announcement} event`);
        }
        case 'overridechan': {
          const announcement = args.shift().toLowerCase();
          if (!overrideableAnnouncements.includes(announcement)) return message.reply(`invalid overrideable announcement event: ${announcement}`);

          if (!args.length) return message.reply("you didn't provide a channel name!");
          const channelName = args.shift();
          if (message.guild.channels.cache.find((c) => c.name === channelName) === null) return message.reply(`${channelName} does not exist in this guild!`);

          db.set(`${message.guild.id}.announcements.${announcement}.channel_override`, channelName).write();
          return message.reply(`successfully overrode the announcements channel for ${announcement} to #${channelName}`);
        }
        default:
          return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: channel, enable, disable, addmessage, overridechan)`);
      }
    } else {
      return message.reply(`\`${subcommand}\` is not a valid subcommand!`);
    }
  },
};
