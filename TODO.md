# todo

## General

1. Reimplement logging with `winston`
   1. Use `chalk` for coloring output?
   2. Point is going to be removing all `console.log` calls, eventually re-enable `no-console` in `.eslintrc.json`
2. only async command modules that use await
3. update discord.js to v12
   1. going to be an absolute **doozy**

## New Commands

1. Add back `prefix` command from old discord bot, read from db
   1. allow setting prefix from here, because fuck adding that to the already too-big bot command
2. `weather` - use darksky stuff if you still have it
   1. `darkskyjs`
   2. take zip as argument
   3. default to user location? idk if thats possible
   4. maybe default to bot location then
3. look into KSoft APIs for commands
4. `amazon` - search amazon for items
5. `quote` - generate and send a random quote? might be dumb idk
6. unicode text fucker, given input perform replacements on text to get funky text
7. `ask` - based on question form, give a quasirealistic answer (speech processing???)
8. `remind` - set a reminder for a user, store info for reminder in db for keeping them when offline
9. ps name gen

## Bug fixes

1. `quickpoll` - fix the awaitReactions portion
2. `e621` - getting 403 forbidden on requests, also look into arg parsing
3. `b` - might have trouble with double b's, just test the regex shit

## Command Updates

1. `fakeperson` - add address generation from fakeaddressgenerator?
2. `alexa` - check comments
3. `bot` - set username

## Links

- [canvas for image manipulation](https://discordjs.guide/popular-topics/canvas.html#setting-up-canvas)
  - Maybe figure out deep frying at some point?
- [extra embed info](https://discordjs.guide/popular-topics/embeds.html#embed-preview)
- [embed visualizer](https://leovoel.github.io/embed-visualizer/)
- [discord emoji info](https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/using-emojis.md)
- [Wanna write some custom tags?](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates)

## Far out shit

1. Command piping?
2. Keep a command log, add command for repeating last command?
3. add custom commands via a command, store in db?
