# todo

1. `bot.js` update guilds & users
2. move more stuff from .env to db
   1. namely, prefix
3. Update the rest of the command modules from previous bots
   1. fakeperson - add address generation from fakeaddressgenerator?
4. Rich embeds everywhere
   1. `index.js`
      1. `channelCreate` and `channelDelete` events
   2. existing command modules
5. Additional reaction procesing (role on react type of thing?)
6. `message.awaitReactions` for a quick poll thing?
7. any other bot settings you want to add commands for?
8. ctrl-f "todo" in `index.js` and existing command modules
9.  Fix reddit module
10. Think about everything in the bot that is user controlled, check for exploits (`bot.js` might have one)
11. Reimplement logging with `winston`
    1. Use `chalk` for coloring output?
    2. Point is going to be removing all `console.log` calls, eventually re-enable `no-console` in `.eslintrc.json`
12. `common-tags` cleanup
    1. [Wanna write some custom tags?](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates)
13. Change eslint indent rule to spaces, convert all files
    1. 2 spaces? or 4?
    2. make a separate branch for this later
14. Make eslintrc epic
    1. [eslint rules](https://eslint.org/docs/rules/)
       1. ecmascript 6 section is all thats left
    2. go through and check all modules
15. Regex fixes:
    1.  Replace any spaces with \s (ex: index.js:236)
16. async all command modules?

## Links

- [canvas for image manipulation](https://discordjs.guide/popular-topics/canvas.html#setting-up-canvas)
- [extra embed info](https://discordjs.guide/popular-topics/embeds.html#embed-preview)
- [discord emoji info](https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/using-emojis.md)
