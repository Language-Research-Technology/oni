require('regenerator-runtime/runtime');
const fetch = require('node-fetch');
const { testHost } = require('../../common');
const { ROCrate } = require('ro-crate');

jest.setTimeout(10000);

const conformsTo = `https://github.com/Language-Research-Technology/ro-crate-profile%23Collection`;
const collectionId = `arcp://name,sydney-speaks/root/description`;
const baseOfCollection = `${testHost}/data?conformsTo=${conformsTo}&memberOf=${collectionId}`;
const baseRequest = `${testHost}/data?id=${collectionId}&resolve-links`;
let baseCrates;

describe('Test load records', () => {
    test('it should be able to retrieve records', async () => {
        let response = await fetch(baseRequest);
        expect(response.status).toEqual(200);
        baseCrates = await response.json();
        expect(res.data.length).toBeGreaterThanOrEqual(0);
    });
    // test('it should be able to fetch each members', async () => {
    //     for (let resCrate of baseCrates['data']) {
    //         const subCrate = `${testHost}/data?id=${resCrate[crateId]}&members}`;
    //         let response = await fetch(subCrate);
    //         console.log(response);
    //     }
    // });
});
