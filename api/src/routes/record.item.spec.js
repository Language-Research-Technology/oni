require('regenerator-runtime/runtime');
const fetch = require('node-fetch');
const { testHost } = require('../services');

jest.setTimeout(10000);

describe('Test load records', () => {
  test('it should be able to retrieve 1 record', async () => {
    const crateId = `arcp://name,ATAP/uts.edu.au`;
    let response = await fetch(`${ testHost }/data?id=${ crateId }`);
    expect(response.status).toEqual(200);
  });
  test('it should be able to retrieve 1 item of the record', async () => {
    const crateId = `arcp://name,ATAP/uts.edu.au`;
    let response = await fetch(`${ testHost }/data/item?id=${crateId}&file=files/165/original_2e21ee2bdb706deca25326c1128d745c.jpg`);
    expect(response.status).toEqual(200);
  });
});
