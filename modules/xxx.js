const lines = [
	'Yo, what do we have here? The CUMSHIP.XXX?',
	'C U M\nS H I P\n. X X X',
	'Docking up to the COCKSHIP.XXX',
	'LOADED with PLEDGE BOIS?!?? n FRAT JOCKS??!?!??!?!?!?!?',
	'Stripped NAKED??!?!?!?!',
	'HUGE hard COCKs as HARD as ROCKS?!',
	'𝙔𝙊!!!',
	'PLEDGE BOYS',
	'GONNA BE FUCKED N FUCKD N FUCKD',
	'FUCKDNFUCKDNFUCKD',
	'YO',
	'YALE ND HARVARD',
	'U C L A',
	'UNIVERSITY OF TEXAS ALABAMA OHI0??!?',
	'CAMEBRIDGE OXFORD',
	'PLEDGE BOYS STRIPPED NAKED, HUGE HARD COCKS AS HARD AS ROCKS',
	'FRATJOCKS GUNNA FUCKNFUCKNFUK THOSE BOYES',
	'𝐘𝐎𝐨𝐎𝐨𝐨𝐎𝐎𝐎!',
	'18 naked cowboys in the showers at ram ranch',
	'under lockdown!?!',
	'ram ranch is under siege!',
	'gonna find prince harry...',
	'gonna fuck prince harry\'s butt!',
	'big hard throbbing cock wanting to be sucked',
	'18 naked cowboys wanting to be fucked',
	'ram ranch REALLY rocks!',
	'cowboys in the showers at ram ranch!!',
	'ORGY in the showers at ram ranch!!!!!',
	'28 us marines pulling up in black ford raptor trucks',
	'yeah brennan!',
	'long dick brennan!',
	'gonna FUk those boys!!!',
	'cowboys LUV big haRd thrOBBing COKS!!!',
	'gonna fuk me sum cowboys!',
	'breed and breed and breed',
	'loads and loads and loads of cum',
	'loads and loads of cum',
	'cummin and cummin and cummin',
	'gonna fuck n fuck n fuck n fuck n fuck n fuck n fuck n those pledge boys',
];

module.exports = {
	name: 'xxx',
	description: 'Sends a random line from various Grant MacDonald hits.',
	args: false,
	guildOnly: false,
	execute(message, args) {
		message.channel.send(lines[Math.floor(Math.random() * lines.length)]);
	},
};
