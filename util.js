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
      // console.log(hexString);
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
};

const addFieldIfNotEmpty = (embed, fieldName, fieldData, inline) => {
  if (!fieldData.length) return;

  embed.addField(fieldName, fieldData.join(', '), inline);
};

module.exports = {
  trim: trim,
  hashString: hashString,
  normalizeHash: normalizeHash,
  generateRandomHexString: generateRandomHexString,
  generateUserHexString: generateUserHexString,
  addFieldIfNotEmpty: addFieldIfNotEmpty,
};
