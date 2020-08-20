const strawpoll = require('strawpolljs');
// following would be for the create option
// const fetch = require('node-fetch');

const read = async (args) => {
  args.shift();

  const isURL = args[0].match(/https:\/\/(?:www\.)?strawpoll.me\/\d+/giu);
  const isID = args[0].match(/\d+/giu);

  if (!(isURL || isID)) {
    return 'You must provide a proper strawpoll URL or strawpoll poll ID to read the results!';
  }

  let pollNum = '';

  if (isURL) {
    pollNum = args.shift().split('/').pop();
  } else if (isID) {
    pollNum = args.shift();
  } else {
    console.error('wtf? this shouldn\'t happen');
    return 'something went seriously wrong, yo';
  }

  try {
    const response = await strawpoll.readPoll(pollNum);
    const json = JSON.parse(response);
    const topResult = {
      result: '',
      votes: 0,
    };

    for (let i = 0; i < json.votes.length; i++) {
      if (json.votes[i] > topResult.votes) {
        topResult.votes = json.votes[i];
        topResult.result = json.options[i];
      }
    }

    return `Winning result for "${json.title.trim()}": "${topResult.result.trim()}" with ${topResult.votes} votes.`;
  } catch (err) {
    console.error(err);
    return 'An error occurred while processing the read request!';
  }
};

// bad, work on later
// const create = (args, bot) => {
//   // Title parsing

//   const titleArray = [];

//   if (!args[0].startsWith('"')) {
//     bot.sendMessage('Your title must be enclosed in quotation marks!');
//     return;
//   }

//   titleArray.push(args.shift());

//   while (!args[0].includes('"')) {
//     if (args.length) {
//       titleArray.push(args.shift());
//     } else {
//       bot.sendMessage('Your title must be enclosed in quotation marks!');
//       return;
//     }
//   }

//   if (!args[0].includes('"')) {
//     bot.sendMessage('Your title must be enclosed in quotation marks!');
//     return;
//   }

//   titleArray.push(args.shift());

//   if (!args.length) {
//     bot.sendMessage('You need to include some options with your poll!');
//     return;
//   }

//   const title = titleArray.join(' ');

//   // The rest of the command parsing (aka draw the rest of the fucking owl)

//   const multi = args.includes('-m');
//   args = args.filter(item => item != '-m');
//   const options = args.join(' ').split(/\s\|\s/g);

//   console.log(title, multi, options);

//   // Create poll

//   // TODO: finish fixing this fucking mess

//   req({
//     method: 'POST',
//     uri: 'https://strawpoll.me/api/v2/polls',
//     followAllRedirects: true,
//     body: {
//       title: title,
//       options: options,
//       mutli: multi,
//     },
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   }, (err, res, body) => {
//     if (err) {
//       console.error(err);
//       bot.sendMessage('Ruh roh, raggy! [Something went wrong processing that request...]');
//       return;
//     }

//     console.log(body);

//     // if (body.id !== undefined) {
//     // 	bot.sendMessage(`https://strawpoll.me/${json.id}`);
//     // } else {
//     // 	bot.sendMessage('Ruh roh, raggy! [Something went wrong processing that request...]');
//     // }
//   });

//   // strawpoll.createPoll({
//   // 	title: title,
//   // 	options: options,
//   // 	multi: multi,
//   // }).then(res => {
//   // 	const json = JSON.parse(res);
//   // 	if (json.id !== undefined) {
//   // 		bot.sendMessage(`https://strawpoll.me/${json.id}`);
//   // 	} else {
//   // 		bot.sendMessage('Ruh roh, raggy! [Something went wrong processing that request...]');
//   // 	}
//   // }).catch(err => {
//   // 	console.error(err);
//   // 	bot.sendMessage('Ruh roh, raggy! [Something went wrong processing that request...]');
//   // });
// };

module.exports = {
  name: 'strawpoll',
  aliases: ['sp'],
  description: 'Get the results of a strawpoll from a link, or create a new strawpoll.\n Strawpoll creation notes: Surround the title with quotation marks. Options are seperated with a pipe ("|") character. Use the "-m" flag for allowing multiple answers. See usage.',
  usage: '<-r> <link | poll number> | [-m] <"title"> <options> ',
  args: true,
  cooldown: 5,
  async execute(message, args) {
    if (args[0] == '-r') {
      const res = await read(args);
      message.reply(res);
    } else {
      // create(args);
      message.reply('no');
    }
  },
};
