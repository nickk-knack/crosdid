# todo

1. `bot.js` module - add subcommand to modify secret message/react chance, and enable/disable each
2. Update the rest of the command modules from previous bots
3. Rich embeds everywhere
   1. `index.js`
      1. `messageReactionAdd` event
      2. `channelCreate` and `channelDelete` events
   2. existing command modules
4. Additional reaction procesing (role on react type of thing?)
5. `message.awaitReactions` for a quick poll thing?
6. any other bot settings you want to add commands for?
7. ctrl-f "todo" in `index.js` and existing command modules
8. Fix reddit module
9.  Think about everything in the bot that is user controlled, check for exploits (`bot.js` might have one)
10. Reimplement logging with `winston`
    1. Use `chalk` for coloring output?
11. `common-tags` for better template literals in code?
    1. Could really clean some shit up
    2. Also, opportunity to just write some custom tags... for fun?
    3. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates

## Links

- https://discordjs.guide/popular-topics/canvas.html#setting-up-canvas
- https://discordjs.guide/popular-topics/embeds.html#embed-preview
- https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/using-emojis.md
- 
