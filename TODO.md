# todo

## General

1. Reimplement logging with `winston`
   1. Use `chalk` for coloring output?
   2. Point is going to be removing all `console.log` calls, eventually re-enable `no-console` in `.eslintrc.json`
2. only async command modules that use await
   1. could update some commands to switch from using promise syntax to using async/await syntax
   2. should prob do that on a separate branch tho
   3. keep in mind, you will need to put it all in a try/catch block
3. use `querystring` (native to node) to create query strings for requests
   1. especially in `urban`
4. should probably go through and rethink error handling in command modules
   1. throw error objects and handle them in client.on('message') instead of console.error + message.reply each time you should just be throwing
5. update discord.js to v12
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
9. `imageflip` (or similar) - meme making shit
10. ps name gen

## Bug fixes

1. `quickpoll`
   1. winningReacts may or may not be broken still
   2. emojiRegex may be failing, something is causing guild emojis to be passed through as a regular emoji (~line 50)
      1. can't really find a pattern to it
   3. look around at other projects using discord.js, see if this (or similar) is implemented
2. `e621`
   1. getting 403 forbidden on requests
   2. also look into arg parsing
3. `b`
   1. might have trouble with double b's
   2. just test the regex shit

## Command Updates

1. `fakeperson` - add address generation from fakeaddressgenerator?
2. `alexa` - check comments
3. `bot` - set username
4. `quickpoll` - use moment, add try/catches where necessary for async/await stuff

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
