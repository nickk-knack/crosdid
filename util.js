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

module.exports = {
  generateRandomHexString: generateRandomHexString,
  generateUserHexString: generateUserHexString,
};
