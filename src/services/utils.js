import path from "node:path";
import util from "node:util";
import crypto from "node:crypto";

export function workingPath(currentPath) {
  if (path.isAbsolute(currentPath)) {
    return currentPath;
  } else {
    return path.join(process.cwd(), currentPath);
  }
}

export function inspect(obj, depth = null) {
  const ins = util.inspect(obj, {showHidden: false, depth, colors: true})
  console.log(ins);
}

export function encrypt(securityKey, data, initVector) {
  if (!initVector) {
    initVector = crypto.randomBytes(16);
  } else {
    initVector = Buffer.from(initVector, 'hex');
  }
  const key = crypto.createHash('sha256').update(securityKey).digest().slice(0, 16); //https://github.com/nodejs/node/issues/6696
  const cipher = crypto.createCipheriv('aes128', key, initVector);
  let encryptedData = Buffer.concat([
    cipher.update(data),
    cipher.final()
  ]);
  return initVector.toString('hex') + '.' + encryptedData.toString('hex');
}

export function decrypt(securityKey, data, initVector) {
  const iv_k = data.split('.');
  if (!initVector) {
    initVector = Buffer.from(iv_k[0], 'hex');
  } else {
    initVector = Buffer.from(initVector, 'hex');
  }
  const key = crypto.createHash('sha256').update(securityKey).digest().slice(0, 16); //https://github.com/nodejs/node/issues/6696
  const decipher = crypto.createDecipheriv('aes128', key, initVector);
  let decryptedData = Buffer.concat([
    decipher.update(Buffer.from(iv_k[1], 'hex')),
    decipher.final()
  ]);
  return decryptedData.toString();
}

export function findCrateRootId(metadataId, crate) {
  for (const entity of crate['@graph']) {
    if (entity['@id'] === metadataId) {
      return entity.about['@id'];
    }
  }
}