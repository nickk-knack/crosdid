const { MessageEmbed } = require('discord.js');
const randomHex = require('random-hex');
const { trim } = require('../util');

module.exports = {
  name: 'help',
  aliases: ['commands'],
  description: 'List all commands/info about specific commands',
  usage: '[command name]',
  cooldown: 3,
  async execute(message, args) {
    const { db, commands, user } = message.client;
    const prefix = await db.get('command_prefix').value() || user.toString();

    const embed = new MessageEmbed().setColor(randomHex.generate());

    if (!args.length) {
      embed
        .setTitle('Help/Commands')
        .setDescription(`You can send ${prefix}help [command name] for info on a specific command.`)
        .addField('**Command List**', trim(commands.map((command) => command.name).join(', '), 1024));
    } else {
      const command = commands.get(args[0]) || commands.find((cmd) => cmd.aliases && cmd.aliases.includes(args[0]));

      if (!command) {
        return message.reply(`"${args[0]}" is not a valid command or alias!`);
      }

      if (command.opOnly) {
        const isOp = await db.get('operators').includes(message.author.id).value();

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
        embed.addField('Usage:', trim(`\`${prefix}${command.name} ${command.usage}\``, 1024));
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
        throw new Error(`Something went wrong while trying to send a DM. (${e})`);
      });
  },
};
