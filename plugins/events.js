// Notes on these objects:
// send_message will only really work if send_emoji is true

module.exports.emojiCreateChannel = {
	// cuddling bar : emoji-town
	'625766841779879967': {
		channel_id: '649660798221680652',
		send_emoji: true,
		send_message: true,
		message_prepend: true,
		messages: [
			'hot off the presses:',
			'brand new epic emoji:',
		],
	},
};

module.exports.emojiUpdateChannel = {
	// cuddling bar : emoji-town
	'625766841779879967': {
		channel_id: '649660798221680652',
		send_old_emoji: true,
		send_new_emoji: true,
		send_message: true,
		message_prepend: true,
		messages: [
			'an emoji has been updated:',
			'new old emoji:',
		],
	},
};