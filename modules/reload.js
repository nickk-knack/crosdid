const fs = require('fs');

module.exports = {
  name: 'reload',
  description: 'Reloads the database and/or command modules',
  usage: '<all> | <-c [command] | -d>',
  args: true,
  guildOnly: false,
  opOnly: true,
  cooldown: 3,
  async execute(message, args) {
    const mode = args.shift().toLowerCase();
    const { db, commands } = message.client;
    let reply = '';

    if (mode === '-d' || mode === 'all') {
      await db.read();
      reply += 'Read database into memory.';
    }

    if (mode === '-c' || mode === 'all') {
      if (args.length) {
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName) || commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) {
          return message.reply(`there is no command with name/alias \`${commandName}\`.`);
        }

        delete require.cache[require.resolve(`./${command.name}.js`)];

        try {
          const newCommand = require(`./${command.name}.js`); // eslint-disable-line global-require
          commands.set(newCommand.name, newCommand);
          reply += (reply.length ? '\n' : '');
          reply += `Reloaded single command module: ${command.name}`;
        } catch (e) {
          throw new Error(`There was an error while reloading that command. (${e})`);
        }
      } else {
        const commandModules = fs.readdirSync('./modules');
        commands.clear();

        for (const file of commandModules) {
          if (!file.endsWith('.js')) continue;

          const blacklisted = await db.get('global_disabled_cmd_modules').includes(file.split('.')[0]).value();
          if (blacklisted) continue;

          delete require.cache[require.resolve(`./${file}`)];

          try {
            const command = require(`./${file}`); // eslint-disable-line global-require
            commands.set(command.name, command);
          } catch (e) {
            throw new Error(`There was an error while reloading commands at ${file}. (${e})`);
          }
        }

        reply += (reply.length ? '\n' : '');

        const disabledCmdList = await db.get('global_disabled_cmd_modules').value().join(', ');
        reply += `Reloaded all command modules. Skipped the following: ${disabledCmdList}.`;
      }
    }

    message.reply(reply);
  },
};
