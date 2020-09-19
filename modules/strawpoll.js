const strawpoll = require('strawpolljs');
const fetch = require('node-fetch');

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
    throw new Error('Something went seriously wrong, yo. (got neither a url nor an id)');
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
  } catch (e) {
    throw new Error(`An error occurred while processing the read request! ${e.message}`);
  }
};

// untested
const create = async (args) => {
  // Title parsing
  const titleArray = [];
  if (!args[0].startsWith('"')) {
    return 'Your title must be enclosed in quotation marks!';
  }

  titleArray.push(args.shift());
  while (!args[0].includes('"')) {
    if (args.length) {
      titleArray.push(args.shift());
    } else {
      return 'Your title must be enclosed in quotation marks!';
    }
  }

  if (!args[0].includes('"')) {
    return 'Your title must be enclosed in quotation marks!';
  }

  titleArray.push(args.shift());
  if (!args.length) {
    return 'You need to include some options with your poll!';
  }

  const title = titleArray.join(' ');

  // The rest of the command parsing (aka draw the rest of the fucking owl)
  const multi = args.includes('-m');
  args = args.filter((item) => item != '-m');
  const options = args.join(' ').split(/\s\|\s/gu);

  // console.log(title, multi, options);

  // Create poll
  // TODO: test this mess
  try {
    const response = await fetch('https://strawpoll.me/api/v2/polls', {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        title: title,
        options: options,
        multi: multi,
      },
    });
    const json = await response.json();

    // console.log(json);

    if (json.id) {
      return `https://strawpoll.me/${json.id}`;
    } else {
      return 'something went wrong while creating that strawpoll...';
    }
  } catch (e) {
    throw new Error(`An error occurred while creating the strawpoll. (${e.message})`);
  }

  // strawpoll.createPoll({
  // 	title: title,
  // 	options: options,
  // 	multi: multi,
  // }).then(res => {
  // 	const json = JSON.parse(res);
  // 	if (json.id !== undefined) {
  // 		bot.sendMessage(`https://strawpoll.me/${json.id}`);
  // 	} else {
  // 		bot.sendMessage('Ruh roh, raggy! [Something went wrong processing that request...]');
  // 	}
  // }).catch(e => {
  // 	console.error(e);
  // 	bot.sendMessage('Ruh roh, raggy! [Something went wrong processing that request...]');
  // });
};

module.exports = {
  name: 'strawpoll',
  aliases: ['sp'],
  description: 'Get the results of a strawpoll from a link, or create a new strawpoll.\n Strawpoll creation notes: Surround the title with quotation marks. Options are seperated with a pipe ("|") character. Use the "-m" flag for allowing multiple answers. See usage.',
  usage: '<-r> <link | poll number> | [-m] <"title"> <options> ',
  args: true,
  cooldown: 5,
  async execute(message, args) {
    const readFlag = args[0].toLowerCase();
    const res = (readFlag === '-r') ? await read(args) : await create(args);
    message.reply(res);
  },
};
