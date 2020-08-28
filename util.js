const chalk = require('chalk');
const { format } = require('winston');

const consolePrint = format.printf(({ level, message, timestamp }) => {
  return chalk`{gray [${timestamp}] ({bold ${level}})}: ${message}`;
});

const filePrint = format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] (${level}): ${message}`;
});

const consoleFormat = format.combine(
  format.timestamp(),
  consolePrint,
);

const fileFormat = format.combine(
  format.timestamp(),
  filePrint,
);

const getRandomFromArray = (array) => array[Math.floor(Math.random() * array.length)];

const trim = (str, max) => (str.length > max) ? `${str.slice(0, max - 3)}...` : str;

const hashString = (string) => {
  let hash = 0;

  if (string.length === 0) return hash;

  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }

  return hash + 0x7FFFffff;
};

const normalizeHash = (val) => (val / 0xFFFFfffe);

const generateRandomHexString = (length) => {
  let hexString = '';
  let validString = false;
  let iterations = 0;

  while (!validString) {
    for (let i = 0; i < length; i++) {
      const rand = Math.floor(Math.random() * 256);
      let randStr = rand.toString(16).slice(-2);

      if (randStr.length === 1) {
        randStr = `0${randStr}`;
      }

      hexString += randStr;
    }

    iterations++;

    if (hexString.length === length * 2) {
      // Break loop, it's valid
      validString = true;
    } else {
      // If this has taken more than 50 tries, abort
      if (iterations > 50) throw new Error('Could not generate a valid hex string');

      // Reset string and try again, wrong length
      hexString = '';
    }
  }

  return hexString;
};

const generateUserHexString = (length, args) => {
  let hexString = '';
  const argsCopy = args;
  const argCount = args.length;
  const remaining = length - argCount;

  // TODO: take up to 30 values, convert to hex string
  for (let i = 0; i < argCount; i++) {
    hexString += args.shift().toLowerCase();
  }

  for (let i = 0; i < remaining; i++) {
    hexString += '00';
  }

  if (hexString.length !== length * 2) {
    throw new Error(`Could not generate a valid hex string from args: ${argsCopy.join(' ')}`);
  }

  return hexString;
};

const addFieldIfNotEmpty = (embed, fieldName, fieldData, inline) => {
  if (typeof fieldData !== 'string') throw new Error('fieldData must be a string!');
  if (fieldData === '') return;

  embed.addField(fieldName, fieldData, inline);
};

const dbDefaultGuildObj = {
  last_command: '',
  reaction_notify: false,
  bot_log_channel: false,
  secret_messages: {
    enabled: false,
    chance: 0.05,
  },
  secret_reacts: {
    enabled: false,
    chance: 0.05,
  },
  users: [],
  disabled_cmd_modules: [],
  enable_phrases: true,
  phrases: [],
  announcements: {
    channel: '',
    channel_create: {
      enabled: false,
      messages: [],
    },
    channel_delete: {
      enabled: false,
      messages: [],
    },
    channel_update: {
      enabled: false,
      messages: [],
    },
    emoji_create: {
      enabled: false,
      channel_override: '',
      messages: [],
    },
    emoji_delete: {
      enabled: false,
      channel_override: '',
      messages: [],
    },
    emoji_update: {
      enabled: false,
      channel_override: '',
      messages: [],
    },
  },
  good_count: 0,
  bad_count: 0,
  thank_count: 0,
};

module.exports = {
  consoleFormat: consoleFormat,
  fileFormat: fileFormat,
  getRandomFromArray: getRandomFromArray,
  trim: trim,
  hashString: hashString,
  normalizeHash: normalizeHash,
  generateRandomHexString: generateRandomHexString,
  generateUserHexString: generateUserHexString,
  addFieldIfNotEmpty: addFieldIfNotEmpty,
  dbDefaultGuildObj: dbDefaultGuildObj,
};
