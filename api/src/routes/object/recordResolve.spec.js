require('regenerator-runtime/runtime');
import { testHost, loadConfiguration } from '../../services';
import { ROCrate } from 'ro-crate';

jest.setTimeout(100000);

const collectionId = `arcp://name,sydney-speaks/root/description`;
const baseRequest = `${ testHost }/data?id=${ collectionId }&resolve-links`;
let resolvedCrate, rocrate;

describe('Test load records', () => {
  it('it should be able to retrieve records', async () => {
    let response = await fetch(baseRequest);
    expect(response.status).toEqual(200);
    resolvedCrate = await response.json();
    rocrate = new ROCrate(resolvedCrate);
    rocrate.index();
    const rootId = rocrate.getRootId();
    expect(rootId).toBe('./');
  });
  it('it should be able to fetch all members of the OCFL repo', async () => {
    let configuration = await loadConfiguration();
    const namedId = rocrate.getNamedIdentifier(configuration.api.identifier.main);
    expect(namedId).toBe(collectionId);
  });
});
