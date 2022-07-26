require("regenerator-runtime/runtime");
const utils = require('./utils');
const assert = require("assert");

const securityKey = 'security_key';

describe("utility tests", () => {

  it('should encrypt with security key', () => {
    const data = 'Encrypt my data pleaaseee';
    const encrypted = utils.encrypt(securityKey, data);
    console.log(encrypted)
    const decrypted = utils.decrypt(securityKey, encrypted);
    assert.equal(data, decrypted);
  });

});
