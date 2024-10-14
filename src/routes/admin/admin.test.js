import { setTimeout } from 'node:timers/promises';
import { sequelize } from "#src/models/sequelize.js";

describe('Test end point /admin', function () {
  var headers;
  before(function () {
    const adminToken = this.configuration.api.tokens.admin;
    headers = { Authorization: `Bearer ${adminToken}` };
  });
  describe('/admin/index/structural', function () {
    it('can not be accessed without admin token', async function () {
      const res = await this.app.request('admin/index/structural');
      expect(res.status).toEqual(401);
    });
    it('can create index', async function () {
      const res = await this.app.request('admin/index/structural?force', { headers, method: 'post' });
      expect(res.status).toEqual(202);
      //console.log(await res.json());
      while (true) {
        await setTimeout(100);
        const res = await this.app.request('admin/index/structural', { headers });
        if ((await res.json())?.state === 'indexed') break;
      }
      const records = await sequelize.models.record.count();
      expect(records).toEqual(4);
      //expect((await res.json()).state).toEqual('indexed');
    });
    it('can get the state', async function () {
      const res = await this.app.request('admin/index/structural', { headers });
      expect(res.status).toEqual(200);
      expect((await res.json()).state).toEqual('indexed');
    });
  });
  describe('/admin/index/search', function () {
    it('can get the state', async function () {
      const res = await this.app.request('admin/index/search', { headers });
      expect(res.status).toEqual(200);
      expect((await res.json()).state).toEqual('indexed');
    });
  });

});