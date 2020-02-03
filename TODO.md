# todo

1. `bot.js` update guilds & users
2. move more stuff from .env to db
   1. namely, prefix
3. fakeperson - add address generation from fakeaddressgenerator?
4. `quickpoll` - finish, fix the awaitReactions portion
5. any other bot settings you want to add commands for?
6. Think about everything in the bot that is user controlled, check for exploits (`bot.js` might have one)
7. Reimplement logging with `winston`
    1. Use `chalk` for coloring output?
    2. Point is going to be removing all `console.log` calls, eventually re-enable `no-console` in `.eslintrc.json`
8. async all command modules?
9.  anywhere you try to access message.guild.id, check that you are in a guild first... too many crashes
10. make all messages from the bot consistent across all files!
11. Modify `good`/`bad`/`thank` command modules
    1. increment a `good`/`bad`/`thank` counter in guild db
12. Add `about` command module
    1. display bot's ratio of good:bad for the guild (add check to only let this happen in guild)
    2. display number of times bot has been thanked
    3. display prefix (from db)
    4. display some other various bot settings
    5. all in some rich embed

## Links

- [canvas for image manipulation](https://discordjs.guide/popular-topics/canvas.html#setting-up-canvas)
- [extra embed info](https://discordjs.guide/popular-topics/embeds.html#embed-preview)
- [embed visualizer](https://leovoel.github.io/embed-visualizer/)
- [discord emoji info](https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/using-emojis.md)
- [Wanna write some custom tags?](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates)
