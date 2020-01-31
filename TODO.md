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
7. Fix reddit module
8. Think about everything in the bot that is user controlled, check for exploits (`bot.js` might have one)
9. Reimplement logging with `winston`
    1. Use `chalk` for coloring output?
    2. Point is going to be removing all `console.log` calls, eventually re-enable `no-console` in `.eslintrc.json`
10. `common-tags` cleanup
    1. [Wanna write some custom tags?](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates)
11. Change eslint indent rule to spaces, convert all files
    1. 2 spaces? or 4?
    2. make a separate branch for this later
12. Regex fixes:
    1. Replace any spaces with \s (ex: index.js:236)
    2. Remove unused capture groups (you really liked to do this)
13. async all command modules?
14. anywhere you try to access message.guild.id, check that you are in a guild first... too many crashes
15. make all messages from the bot consistent across all files!

## Links

- [canvas for image manipulation](https://discordjs.guide/popular-topics/canvas.html#setting-up-canvas)
- [extra embed info](https://discordjs.guide/popular-topics/embeds.html#embed-preview)
- [embed visualizer](https://leovoel.github.io/embed-visualizer/)
- [discord emoji info](https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/using-emojis.md)
