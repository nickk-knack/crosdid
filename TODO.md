# crosdid todo

## General

1. re-enable, test, fix reactionNotify functionality
   1. was trying to do this, but using `bot` command to enable reactionNotify didn't exactly work. need to look into this
      1. future nick: i meant that the db didnt update and the setting was not enabled, despite the bot saying it was. similar to db issue i encountered earlier in this command? i think with setting username
2. switch db to fileasync? might improve speed, but that also might be unnecessary
3. add some sort of error/"unhandled promise rejection" happening with secret reacts

## Bug fixes

1. `quickpoll`
   1. look around at other projects using discord.js, see if this (or similar) is implemented in order to make it better
2. `wordcloud`
   1. image generation does not fuckin work lmao
   2. maybe try testing canvas separately to find out if its your canvas installation or your code

## Command Updates

1. `strawpoll` - need to test poll creation reimplementation
2. `fakeperson` - add address generation from fakeaddressgenerator?
3. `alexa` - check comments
4. `youtube` - look at comments

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
