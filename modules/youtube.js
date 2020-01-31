const { stripIndents } = require('common-tags');
const search = require('youtube-search');

const opts = {
	maxResults: 10,
	key: process.env.YOUTUBE_API_KEY,
	safeSearch: 'none',
};

const acceptableTypes = ['channel', 'playlist', 'video'];
const acceptableOrderings = ['date', 'rating', 'relevance', 'title', 'views'];

module.exports = {
	name: 'youtube',
	aliases: ['yt'],
	description: stripIndents`Search YouTube for videos.

	Optional command flags:
	\`\`\`
	-1, --top           | return the first result, rather than a random one (note: this is essentially shorthand for -l 1).
	-l, --limit (limit) | set the maximum number of results to 'limit' (1-50).
	-t, --type  (type)  | choose what types of search results you want. accepted types: [${acceptableTypes.join(', ')}] (one-letter short-hand is allowed). 
	-o, --order (order) | specify the ordering of search results (default is relevance). accepted orderings: [${acceptableOrderings.join(', ')}].
	-s, --safe          | enable "moderate" safe search.
	\`\`\``,
	usage: `[-1, --top] [-l, --limit (limit)] [-t, --type (${acceptableOrderings.join(' | ')})] [-o, --order (${acceptableOrderings.join(' | ')})] [-s, --safe] <search terms>`,
	args: true,
	cooldown: 3,
	execute(message, args) {
		// Get flags from args
		const topFlagIndex = args.findIndex((val) => /^-1$|^--top$/giu.test(val));
		if (topFlagIndex > -1) {
			opts.maxResults = 1;
			args.splice(topFlagIndex, 1);
		}

		const safeFlagIndex = args.findIndex((val) => /^-s$|^--safe$/giu.test(val));
		if (safeFlagIndex > -1) {
			opts.safeSearch = 'moderate';
			args.splice(safeFlagIndex, 1);
		}

		const limitFlagIndex = args.findIndex((val) => /^-l$|^--limit$/giu.test(val));
		if (limitFlagIndex > -1) {
			args.splice(limitFlagIndex, 1);

			// The item now at the flag index *should* be a number containing the actual limit
			const parsedLimit = parseInt(args[limitFlagIndex], 10);

			// If it passes, set the limit and splice the argument out. else, error out
			if (isNaN(parsedLimit)) {
				return message.reply(`"${args[limitFlagIndex]}" is not a valid limit!`);
			} else {
				opts.maxResults = parsedLimit;
				args.splice(limitFlagIndex, 1);
			}
		}

		const typeFlagIndex = args.findIndex((val) => /^-t$|^--type$/giu.test(val));
		if (typeFlagIndex > -1) {
			args.splice(typeFlagIndex, 1);

			if (!acceptableTypes.includes(args[typeFlagIndex])) {
				return message.reply(`"${args[typeFlagIndex]}" is not a valid type! (Expected: ${acceptableOrderings.join(' | ')})`);
			} else {
				opts.type = args[typeFlagIndex];
				args.splice(typeFlagIndex, 1);
			}
		}

		const orderFlagIndex = args.findIndex((val) => /^-o$|^--order$/giu.test(val));
		if (orderFlagIndex > -1) {
			args.splice(orderFlagIndex, 1);

			if (!acceptableOrderings.includes(args[orderFlagIndex])) {
				return message.reply(`"${args[orderFlagIndex]}" is not a valid order! (Expected: ${acceptableTypes.join(' | ')})`);
			} else {
				opts.order = args[orderFlagIndex].replace('views', 'viewCount');
				args.splice(orderFlagIndex, 1);
			}
		}

		const query = args.join(' ');

		search(query, opts, (err, res) => {
			if (err) {
				message.reply(`uwu something is fuckie wuckie: ${err.message}`);
				return console.error(err);
			}

			// If Discord ever supports adding videos/video links to embeds, then that would be cool
			const chosen = res[Math.floor(Math.random() * res.length)];

			// Future todo: if the 'kind' is 'youtube#playlist' or 'youtube#channel', make it a custom embed
			message.channel.send(chosen.link);
		});
	},
};
