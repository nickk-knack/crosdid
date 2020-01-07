const responses = [
	'It is certain.',
	'It is decidedly so.',
	'Without a doubt.',
	'Yes, definitely.',
	'You may rely on it.',
	'As I see it, yes.',
	'Most likely.',
	'The outlook is good.',
	'Yes.',
	'Fuck ya dude',
	'Reply hazy, try again.',
	'Ask again later.',
	'Better not tell you now...',
	'Cannot predict now.',
	'Maybe??? Why the fuck would I know that?',
	'Don\'t count on it.',
	'My reply is no.',
	'My sources say no.',
	'Very doubtful.',
	'Fuck no, bro.',
	'Absolutely the fuck not.',
	'Grilled cheese',
];

module.exports = {
	name: '8ball',
	aliases: ['8', '8b', 'eightball'],
	description: 'Ask the magic 8-ball a question.',
	args: false,
	guildOnly: false,
	usage: '<question>',
	execute(message, args) {
		if (!args.length) {
			return message.reply('You didn\'t ask a question!');
		}

		if (args.join(' ').toLowerCase() == 'am i stupid?') {
			message.reply('\u22c5.\u22c5');
			return;
		}

		message.reply(responses[Math.floor(Math.random() * responses.length)]);
	},
};