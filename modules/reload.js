const fs = require('fs');

module.exports = {
  name: 'reload',
  description: 'Reloads the database and/or command modules',
  usage: '<all> | <-c [command] | -d>',
  args: true,
  guildOnly: false,
  opOnly: true,
  cooldown: 3,
  execute(message, args) {
    const mode = args.shift().toLowerCase();
    const { db, commands } = message.client;

    if (mode === '-d' || mode === 'all') {
      console.log('Reading database...');
      db.read();
    }

    if (mode === '-c' || mode === 'all') {
      if (args.length) {
        console.log('Reloading single command...');
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName) || commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) {
          return message.reply(`there is no command with name/alias \`${commandName}\`.`);
        }

        delete require.cache[require.resolve(`./${command.name}.js`)];

        try {
          const newCommand = require(`./${command.name}.js`); // eslint-disable-line global-require
          commands.set(newCommand.name, newCommand);
        } catch (e) {
          throw new Error(`there was an error while reloading that command. (${e})`);
        }
      } else {
        console.log('Reloading all commands');
        const commandModules = fs.readdirSync('./modules');
        commands.clear();

        for (const file of commandModules) {
          if (!file.endsWith('.js')) continue;
          if (db.get('global_disabled_cmd_modules').includes(file.split('.')[0]).value()) continue;

          delete require.cache[require.resolve(`./${file}`)];

          try {
            const command = require(`./${file}`); // eslint-disable-line global-require
            commands.set(command.name, command);
          } catch (e) {
            throw new Error(`there was an error while reloading commands at ${file}. (${e})`);
          }
        }

        console.log(`\tAll command modules reloaded. Skipped the following: ${db.get('global_disabled_cmd_modules').value().join(', ')}.`);
      }
    }

    message.reply('reload complete!');
  },
};
