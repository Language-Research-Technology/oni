const path = require('path');
const util = require('util')
const crypto = require("crypto");

function workingPath(currentPath) {
  if (path.isAbsolute(currentPath)) {
    return currentPath;
  } else {
    return path.join(process.cwd(), currentPath);
  }
}

function inspect(obj, depth = null) {
  const ins = util.inspect(obj, {showHidden: false, depth, colors: true})
  console.log(ins);
}

function encrypt(securityKey, data) {
  const initVector = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(securityKey).digest().slice(0, 16); //https://github.com/nodejs/node/issues/6696
  const cipher = crypto.createCipheriv('aes128', key, initVector);
  let encryptedData = Buffer.concat([
    cipher.update(data),
    cipher.final()
  ]);
  return initVector.toString('hex') + '.' + encryptedData.toString('hex');
}

function decrypt(securityKey, data) {
  const iv_k = data.split('.');
  const initVector = Buffer.from(iv_k[0], 'hex');
  const key = crypto.createHash('sha256').update(securityKey).digest().slice(0, 16); //https://github.com/nodejs/node/issues/6696
  const decipher = crypto.createDecipheriv('aes128', key, initVector);
  let decryptedData = Buffer.concat([
    decipher.update(Buffer.from(iv_k[1], 'hex')),
    decipher.final()
  ]);
  return decryptedData.toString();
}


module.exports = {
  workingPath,
  inspect,
  encrypt,
  decrypt
}
