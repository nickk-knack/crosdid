# todo

1. `bot.js` update guilds & users
2. move more stuff from .env to db
   1. namely, prefix
3. Update the rest of the command modules from previous bots
   1. fakeperson - add address generation from fakeaddressgenerator?
   2. Update them with rich embeds where applicable, as well
4. Additional reaction procesing (role on react type of thing?)
5. `message.awaitReactions` for a quick poll thing?
6. any other bot settings you want to add commands for?
7. Think about everything in the bot that is user controlled, check for exploits (`bot.js` might have one)
8. Reimplement logging with `winston`
    1. Use `chalk` for coloring output?
    2. Point is going to be removing all `console.log` calls, eventually re-enable `no-console` in `.eslintrc.json`
9. async all command modules?
10. anywhere you try to access message.guild.id, check that you are in a guild first... too many crashes
11. make all messages from the bot consistent across all files!
12. change all findIndex/indexOf result checks from `!== -1` to `> -1`
13. Regex fixes:
    1. Replace any spaces with \s (ex: index.js:236)
    2. Remove unused capture groups (you really liked to do this)

## Links

- [canvas for image manipulation](https://discordjs.guide/popular-topics/canvas.html#setting-up-canvas)
- [extra embed info](https://discordjs.guide/popular-topics/embeds.html#embed-preview)
- [embed visualizer](https://leovoel.github.io/embed-visualizer/)
- [discord emoji info](https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/using-emojis.md)
- [Wanna write some custom tags?](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates)
