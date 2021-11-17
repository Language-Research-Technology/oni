require('regenerator-runtime/runtime');
const fetch = require('node-fetch');
const { testHost } = require('../../services');
const { ROCrate } = require('ro-crate');

jest.setTimeout(10000);

const farmsToFreewaysId = 'arcp://name,farms-to-freeways/root/description';
const farmsToFreewaysName = 'Farms to Freeways Example Dataset';

describe('Test load records', () => {
  test('it should be able to retrieve records', async () => {
    let response = await fetch(`${ testHost }/data`);
    expect(response.status).toEqual(200);
    let res = await response.json();
    expect(res.data.length).toBeGreaterThanOrEqual(0);
  });
  test('it should be able to retrieve 1 record', async () => {
    let response = await fetch(`${ testHost }/data?id=${ farmsToFreewaysId }`);
    expect(response.status).toEqual(200);
    let res = await response.json();
    const crate = new ROCrate(res);
    const root = crate.getRootDataset();
    expect(root['name']).toBe(farmsToFreewaysName);
  });
});
