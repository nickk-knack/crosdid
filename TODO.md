# todo

1. Add back prefix command from old discord bot, read from db
   1. allow setting prefix from here, because fuck adding that to the already too-big bot command
2. fakeperson - add address generation from fakeaddressgenerator?
3. `quickpoll` - finish, fix the awaitReactions portion
4. any other bot settings you want to add commands for?
5. weather command, use owm/darksky stuff if you still have it
   1. take zip as argument
   2. default to user location? idk if thats possible
   3. maybe default to bot location then
6. Reimplement logging with `winston`
    1. Use `chalk` for coloring output?
    2. Point is going to be removing all `console.log` calls, eventually re-enable `no-console` in `.eslintrc.json`
7. async all command modules?

## Links

- [canvas for image manipulation](https://discordjs.guide/popular-topics/canvas.html#setting-up-canvas)
- [extra embed info](https://discordjs.guide/popular-topics/embeds.html#embed-preview)
- [embed visualizer](https://leovoel.github.io/embed-visualizer/)
- [discord emoji info](https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/using-emojis.md)
- [Wanna write some custom tags?](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates)
