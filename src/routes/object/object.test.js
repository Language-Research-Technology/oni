//import { testHost } from '../../services/index.js';
import { ROCrate } from 'ro-crate';
import { readFile } from 'fs/promises';
import path from 'node:path';

// const farmsToFreewaysId = 'arcp://name,farms-to-freeways/root/description';
// const farmsToFreewaysName = 'Farms to Freeways Example Dataset';

describe('Test end point /object', function () {
  const crateOpt = { link: true, array: true };
  /** @type {import('hono').Hono} */
  var app;
  /** @type {import('#src/services/configuration.js').Configuration} */
  var configuration;
  var users;
  before(function () {
    app = this.app;
    configuration = this.configuration;
    users = this.users;
  });
  describe('/object', function () {
    it('can get all objects', async function () {
      const res = await app.request('/object?limit=100');
      expect(res.status).toEqual(200);
      const result = await res.json();
      //console.log(result);
      expect(result.total).toEqual(result.data.length);
      expect(result.total).toEqual(4);
    });

    it('can offset and limit results', async function () {
      let res = await app.request('/object?limit=3');
      expect(res.status).toEqual(200);
      let result = await res.json();
      //expect(result.total).toEqual(3);
      expect(result.data.length).toEqual(3);
      res = await app.request('/object?limit=3&offset=3');
      result = await res.json();
      expect(result.data.length).toEqual(1);
    });

    it('can find top level collection', async function () {
      let res = await app.request('/object?memberOf=null');
      expect(res.status).toEqual(200);
      let result = await res.json();
      expect(result.total).toEqual(2);
    });

    it('can find objects that are member of a specific collection', async function () {
      let res = await app.request('/object?memberOf=' + encodeURIComponent('arcp://name,corpus-of-advanced-oni'));
      expect(res.status).toEqual(200);
      expect((await res.json()).total).toEqual(2);
      res = await app.request('/object?memberOf=null&memberOf=' + encodeURIComponent('arcp://name,corpus-of-advanced-oni'));
      expect(res.status).toEqual(200);
      expect((await res.json()).total).toEqual(4);
    });

    it('can find objects that conforms to a specific profile', async function () {
      let res = await app.request('/object?conformsTo=' + encodeURIComponent('https://w3id.org/ldac/profile#Collection'));
      expect(res.status).toEqual(200);
      expect((await res.json()).total).toEqual(3);
      res = await app.request('/object?conformsTo=' + encodeURIComponent('https://w3id.org/ldac/profile#Object'));
      expect(res.status).toEqual(200);
      expect((await res.json()).total).toEqual(1);
    });

    it('can find objects given memberOf and conformsTo', async function () {
      const conformsTo = encodeURIComponent('https://w3id.org/ldac/profile#Collection');
      const memberOf = encodeURIComponent('arcp://name,corpus-of-advanced-oni');
      const res = await app.request(`/object?conformsTo=${conformsTo}&memberOf=${memberOf}`);
      expect(res.status).toEqual(200);
      const result = await res.json();
      expect(result.total).toEqual(1);
      expect(result.data[0].crateId).toEqual('arcp://name,types-of-oni');
    });

    it('can get a specific object', async function () {
      for (const id of [
        'arcp://name,corpus-of-oni',
        'arcp://name,corpus-of-advanced-oni',
        'arcp://name,oni-manual'
      ]) {
        const encId = encodeURIComponent(id);
        let res = await app.request(`/object?id=${encId}`);
        expect(res.status).toEqual(301);
        expect(res.headers.get('location')).toEqual('/object/' + encId);
        //res = await app.request(res.);
        //const roc = new ROCrate(await res.json(), crateOpt);
        //const result = await res.json()
        //expect(result.crateId).toEqual(id);
      }
    });

  });

  describe('/object/meta', function () {
    it('can get original metadata', async function () {
      const id = encodeURIComponent('arcp://name,types-of-oni');
      const res = await app.request(`/object/meta?id=${id}`);
      expect(res.status).toEqual(301);
      expect(res.headers.get('location')).toEqual(`/object/${id}?meta=original`);
    });
  });

  describe('/stream and /object/open', function () {
    const id = encodeURIComponent('arcp://name,corpus-of-oni');
    const path = encodeURIComponent('media/intro.mpeg');
    const urls = [`/stream?id=${id}&path=${path}`, `/object/open?id=${id}&path=${path}`];
    urls.forEach(async function(url){
      it(`can get file from ${url}`, async function () {
        const res = await app.request(url);
        expect(res.status).toEqual(301);
        expect(res.headers.get('location')).toEqual(`/object/${id}/media/intro.mpeg`);
      });
    });
  });

  describe('/object/open', function () {
    it('can get file', async function () {
      const id = encodeURIComponent('arcp://name,corpus-of-oni');
      const path = encodeURIComponent('media/intro.mpeg');
      const res = await app.request(`/stream?id=${id}&path=${path}`);
      expect(res.status).toEqual(301);
      expect(res.headers.get('location')).toEqual(`/object/${id}/media/intro.mpeg`);
    });
  });

  describe('/object/:id', function () {
    const subs = ['arcp://name,types-of-oni', 'arcp://name,oni-manual'];

    it('can get original metadata', async function () {
      const res = await app.request(`/object/${encodeURIComponent('arcp://name,corpus-of-advanced-oni')}?meta`);
      expect(res.status).toEqual(200);
      const result = await res.json();
      const hasSub = result['@graph'].find(e => subs.includes(e['@id']));
      expect(hasSub).toBeFalsy();
    });

    it('can get combined metadata', async function () {
      const res = await app.request(`/object/${encodeURIComponent('arcp://name,corpus-of-advanced-oni')}?meta=all`);
      expect(res.status).toEqual(200);
      const result = await res.json();
      const hasSub = result['@graph'].find(e => subs.includes(e['@id']));
      expect(hasSub).toBeTruthy();
    });

    it('can get raw metadata', async function () {
      const res = await app.request(`/object/${encodeURIComponent('arcp://name,corpus-of-advanced-oni')}?meta=original&raw`);
      expect(res.status).toEqual(200);
      const result = await res.json();
      const fileEntity = result['@graph'].find(e => e['@id'] === 'logo.svg');
      expect(fileEntity).toBeTruthy();
    });

    it('can download a file from links in metadata', async function () {
      const res = await app.request(`/object/${encodeURIComponent('arcp://name,corpus-of-advanced-oni')}?meta=original`);
      expect(res.status).toEqual(200);
      const result = await res.json();
      const fileEntity = result['@graph'].find(e => [].concat(e['@type']).includes('File'));
      const fileRes = await app.request(fileEntity['@id'], { headers: { authorization: users.john._tokenHeader } });
      expect(fileRes.status).toEqual(200);
      const content1 = await readFile(path.join(testDataRootPath, '/ocfl/corpus-of-advanced-oni/logo.svg'), 'utf8');
      const content2 = await fileRes.text();
      expect(content1).toEqual(content2);
    });

    it('should not be able to find a nested object', async function () {
      const res = await app.request(`/object/${encodeURIComponent('arcp://name,corpus-of-oni/intro')}`);
      expect(res.status).toEqual(404);
    });
  });

  describe('/object/:id/:path', function () {
    const id = encodeURIComponent('arcp://name,corpus-of-oni');
    it('can provide the file without auth', async function () {
      const res = await app.request(`/object/${id}/intro.txt`);
      expect(res.status).toEqual(200);
      expect(res.headers.get('Content-Type')).toEqual('text/plain');
      const content1 = await readFile(path.join(testDataRootPath, '/ocfl/corpus-of-oni/intro.txt'), 'utf8');
      const content2 = await res.text();
      expect(content1).toEqual(content2);
    });
    it('can provide the file with auth', async function () {
      const res = await app.request(`/object/${id}/intro.txt`, { headers: { authorization: users.john._tokenHeader } });
      expect(res.status).toEqual(200);
      expect(res.headers.get('Content-Type')).toEqual('text/plain');
      const content1 = await readFile(path.join(testDataRootPath, '/ocfl/corpus-of-oni/intro.txt'), 'utf8');
      const content2 = await res.text();
      expect(content1).toEqual(content2);
    });
    it('can use nginx x-accel feature', async function () {
      const files = ['data.txt', 'media/intro.mpeg'];
      for (const p of files) {
        const res = await app.request(`/object/${id}/${p}`, { headers: { via: 'nginx', authorization: users.john._tokenHeader } });
        expect(res.status).toEqual(200);
        expect(res.headers.get('X-Accel-Redirect')).toEqual('/ocfl/arcp_name_corpus-of-oni/__object__/v1/content/' + p);
      }
    });

    it('can handle file not found error', async function () {
      const auth = { authorization: users.john._tokenHeader };
      [
        {},
        { via: 'nginx' },
        { ...auth },
        { via: 'nginx', ...auth }
      ].forEach(async headers => {
        const res = await app.request(`/object/${id}/non-existing-file`, { headers } );
        expect(res.status).toEqual(404);
      });
    });

    it('can handle filename that contains non-alphanumeric characters', async function () {
      const filename = 'test data/x!@#$%^&*()- ?:;{}[]~`\'"';
      const id = encodeURIComponent('arcp://name,oni-manual');
      const fp = encodeURIComponent(filename);
      const res = await app.request(`/object/${id}/${fp}`);
      expect(res.status).toEqual(200);
      //expect(res.headers.get('Content-Type')).toEqual('text/plain');
      const content1 = await readFile(path.join(testDataRootPath, '/ocfl/oni-manual', filename), 'utf8');
      const content2 = await res.text();
      expect(content1).toEqual(content2);
    });
  });
});
