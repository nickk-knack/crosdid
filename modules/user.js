const { stripIndent } = require('common-tags');

module.exports = {
  name: 'user',
  description: 'Modify guild user db information for the **mentioned** user',
  usage: stripIndent`<@user> <messages <list             |
                                        add <string>     |
                                        remove <index>>> |
                             <reacts   <list             |
                                        add <string>     |
                                        remove <index>>> |
                             <op <true | false>>`,
  args: true,
  minArgsLength: 3,
  guildOnly: true,
  opOnly: true,
  cooldown: 1,
  async execute(message, args) {
    // Ensure that the mention target isn't @everyone or @here
    if (message.mentions.everyone) return message.reply('you cannot target @everyone/@here!');

    // Don't need to get the user from the first argument, since it should be a mention
    // Shift off the unneeded argument
    args.shift();

    const { db } = message.client;
    const subcommand = args.shift().toLowerCase();
    const subcommandArg = args.shift().toLowerCase();
    const user = message.mentions.members.first();

    let dbUser = await db.get(`guilds.${message.guild.id}.users`).find({ id: user.id });

    switch (subcommand) {
      case 'messages':
        dbUser = await dbUser.get('messages');
        break;
      case 'reacts':
        dbUser = await dbUser.get('reactions');
        break;
      case 'op': {
        // Coerce subcommandArg into a boolean, write it to db
        const ops = await db.get('operators');

        if (subcommandArg === 'true') {
          ops.push(user.id).write();
          return message.reply(`successfully made ${user} an operator for this bot.`);
        } else if (ops.has(user.id).value()) {
          ops.pull(user.id).write();
          return message.reply(`successfully removed ${user} as an operator for this bot.`);
        } else {
          return message.reply(`${user} is not an operator!`);
        }
      }
      default:
        return message.reply(`\`${subcommand}\` is not a valid subcommand!`);
    }

    switch (subcommandArg) {
      case 'list':
      case 'l': {
        let i = -1;
        let replyMessage = '';

        if (subcommand === 'messages') {
          replyMessage = await dbUser.map((x) => `[${++i}.] "${x}"`).join('\n').value();
        } else {
          replyMessage = await dbUser.map((x) => `[${++i}.] ${x.custom ? message.guild.emojis.cache.get(x.emoji) : x.emoji}`).join('\n').value();
        }

        return message.reply(replyMessage);
      }
      case 'add':
      case 'a':
      case '+': {
        // Ensure there are arguments left for the addition
        if (!args.length) return message.reply(`you must provide the ${subcommand.substring(0, subcommand.length - 1)} you wish to add!`);

        if (subcommand === 'messages') {
          const secretMessage = args.join(' ').trim();

          // Check if its a duplicate
          const duplicate = await dbUser.includes(secretMessage).value();
          if (duplicate) {
            return message.reply(`${user} already has "${secretMessage}" as a secret message.`);
          }

          dbUser.push(secretMessage).write();
          return message.reply(`successfully added "${secretMessage}" as a secret message for ${user}`);
        } else {
          const emoji = args.shift();
          const emojiObj = {
            custom: false,
            emoji: emoji,
          };

          if (emoji.includes(':')) {
            emojiObj.custom = true;
            const [, , emojiName] = emoji.substring(1, emoji.length - 1).split(':');
            emojiObj.emoji = emojiName;
          }

          // Check if its a duplicate (this might not be actually work)
          const duplicate = await dbUser.includes(emojiObj).value();
          if (duplicate) {
            return message.reply(`${user} already has ${emojiObj.emoji} as a secret react.`);
          }

          dbUser.push(emojiObj).write();
          return message.reply(`successfully added ${emoji} as a secret react for ${user}`);
        }
      }
      case 'remove':
      case 'rem':
      case 'delete':
      case 'del':
      case '-': {
        // Ensure there is an argument for deletion
        if (!args.length) return message.reply('you must provide the message/reaction you wish to add!');

        // Get and parse index, check that its within bounds
        const index = parseInt(args.shift(), 10);
        const listLength = await dbUser.size().value();
        if (isNaN(index) || index >= listLength) return message.reply(`${index} is out of bounds! [0 - ${listLength - 1}]`);

        // Remove the secret at the given index, save it and output it
        const removed = await dbUser.pullAt(index).write();
        return message.reply(`successfully removed ${removed} from ${user}'s secrets.`);
      }
      default:
        return message.reply(`\`${subcommandArg}\` is not a valid subcommand argument! (Expected: list, add, remove)`);
    }
  },
};
