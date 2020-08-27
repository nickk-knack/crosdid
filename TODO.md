# crosdid todo list

## General bot work

1. switch db to fileasync? might improve speed, but that also might be unnecessary
2. add some sort of error handling for "unhandled promise rejection" happening with secret reacts
3. think about adding a `#bot-log` channel option and then use `winston-discordjs` to add a transport for logging to a discord channel. could be bad-fucking-ass.

## Bugs

1. `wordcloud`
   1. image generation does not fuckin work lmao
   2. maybe try testing canvas separately to find out if its your canvas installation or your code
2. reaction notifications
   1. there might be some sort of bug with the bot's secret react feature that causes two messages to be sent for a secret react

## Existing command updates

1. `strawpoll` - need to test poll creation reimplementation
2. `fakeperson` - add address generation from fakeaddressgenerator?
3. `youtube` - look at comments

## New command ideas

1. add command to allow user to disable react notifications for themself
    1. will require an addition to the user db item, for `reaction_notify` or something
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
    1. on bot startup, check for existing reminders and re-set interval
    2. db should keep time set, time to remind, text, and maybe more?
    3. this would require adding support to index.js for loading in the reminders from db on bootup
    4. maybe create a **startup tasks** loading bit that can load `js` files from `/startup/` (or similar). that way, any modules can add code to index.js as well. extra modding functionality p much?
9. `imageflip` (or similar) - meme making shit
10. `repeat` - repeat last_command for current guild (guildOnly)
    1. this might actually seriously suck big time, not actually easy
11. ps name gen

## Links

- [extra embed info](https://discordjs.guide/popular-topics/embeds.html#embed-preview)
- [embed visualizer](https://leovoel.github.io/embed-visualizer/)
- [discord emoji info](https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/using-emojis.md)
- [wanna write some custom tags?](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates)
- [canvas for image manipulation](https://discordjs.guide/popular-topics/canvas.html#setting-up-canvas)
  - used for wordcloud, but its a bitch
  - maybe figure out deep frying at some point? if you figure it out at all

## Far-out shit

1. Command piping? i dont even know where to start with my code
