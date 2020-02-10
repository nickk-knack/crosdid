# todo

1. Add back `prefix` command from old discord bot, read from db
   1. allow setting prefix from here, because fuck adding that to the already too-big bot command
2. `fakeperson` - add address generation from fakeaddressgenerator?
3. `quickpoll` - finish, fix the awaitReactions portion
4. any other bot settings you want to add commands for?
5. `weather` command, use darksky stuff if you still have it
   1. `darkskyjs`
   2. take zip as argument
   3. default to user location? idk if thats possible
   4. maybe default to bot location then
6. Reimplement logging with `winston`
   1. Use `chalk` for coloring output?
   2. Point is going to be removing all `console.log` calls, eventually re-enable `no-console` in `.eslintrc.json`
7. async all command modules?
8. replace `timethat` with `moment`?
   1. check `moment.duration()` of a moment variable for `now` .diff another moment variable
   2. i.e. in `about` for creation timestamp
   3. [this is what im referencing](https://stackoverflow.com/questions/18623783/get-the-time-difference-between-two-datetimes/18624295)
9. `alexa` command - check comments
10. `e621` - getting 403 forbidden on requests

## Links

- [canvas for image manipulation](https://discordjs.guide/popular-topics/canvas.html#setting-up-canvas)
- [extra embed info](https://discordjs.guide/popular-topics/embeds.html#embed-preview)
- [embed visualizer](https://leovoel.github.io/embed-visualizer/)
- [discord emoji info](https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/using-emojis.md)
- [Wanna write some custom tags?](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates)
