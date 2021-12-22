require('regenerator-runtime/runtime');
import { testHost } from '../../services';

jest.setTimeout(10000);

describe('Test load records', () => {
  test('it should be able to retrieve records', async () => {
    let response = await fetch(`${ testHost }/data`);
    expect(response.status).toEqual(200);
    let res = await response.json();
    expect(res.data.length).toBeGreaterThanOrEqual(0);
  });
  test('it should be able to retrieve 1 record', async () => {
    const arcp = `arcp://name,ATAP/uts.edu.au`;
    let response = await fetch(`${ testHost }/data?arcp=${ arcp }`);
    expect(response.status).toEqual(200);
    let res = await response.json();
    expect(res.arcp).toEqual(arcp);
  });
});
