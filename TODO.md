# crosdid todo

## General

1. Reimplement logging with `winston`
   1. Use `chalk` for coloring output?
   2. Point is going to be removing all `console.log` calls, eventually re-enable `no-console` in `.eslintrc.json`
2. re-enable, test, fix reactionNotify functionality
3. switch db to fileasync? might improve speed, but that also might be unnecessary

## Bug fixes

1. `quickpoll`
   1. winningReacts may or may not be broken still
   2. emojiRegex may be failing, something is causing guild emojis to be passed through as a regular emoji (~line 50)
      1. can't really find a pattern to it
   3. look around at other projects using discord.js, see if this (or similar) is implemented
2. `wordcloud`
   1. image generation does not fuckin work lmao

## Command Updates

1. `fakeperson` - add address generation from fakeaddressgenerator?
2. `alexa` - check comments
3. `quickpoll` - use moment, add try/catches where necessary for async/await stuff
4. `strawpoll` - need to rewrite and reimplement poll creation
5. `youtube` - look at comments

## New Commands

1. `weather` - use darksky stuff if you still have it
   1. `darkskyjs`
   2. take zip as argument
   3. default to user location? idk if thats possible
   4. maybe default to bot location then
2. look into KSoft APIs for commands
3. `amazon` - search amazon for items
4. `quote` - generate and send a random quote? might be dumb idk
5. unicode text fucker, given input perform replacements on text to get funky text
6. `ask` - based on question form, give a quasirealistic answer (speech processing???)
7. `remind` - set a reminder for a user, store info for reminder in db for keeping them when offline
   1. on bot startup, check for existing reminders and re-set interval
   2. db should keep time set, time to remind, text, and maybe more?
8. `imageflip` (or similar) - meme making shit
9. `repeat` - repeat last_command for current guild (guildOnly)
10. ps name gen

## Links

- [canvas for image manipulation](https://discordjs.guide/popular-topics/canvas.html#setting-up-canvas)
  - Maybe figure out deep frying at some point?
- [extra embed info](https://discordjs.guide/popular-topics/embeds.html#embed-preview)
- [embed visualizer](https://leovoel.github.io/embed-visualizer/)
- [discord emoji info](https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/using-emojis.md)
- [Wanna write some custom tags?](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates)

## Far out shit

1. Command piping?
