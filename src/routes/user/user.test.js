import { createJwtToken } from '#src/test-utils.js';


describe('Test end point /user', function () {
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

  describe('/user', function () {
    it('should get user details', async () => {
      const token = await createJwtToken(configuration.api.session.secret, users.john.id, users.john.email);
      const res = await app.request('/user', { 
        headers: { Authorization: `Bearer ${token}`}
      });
      expect(res.status).toEqual(200);
      const user = (await res.json()).user;
      for (let prop of ['id', 'email', 'name', 'provider', 'providerId', 'locked', 'upload']) {
        expect(user[prop]).toEqual(users.john.get(prop));
      }
      expect(user.accessToken).toBeUndefined();
      expect(user.apiToken).toBeUndefined();
    });
  });

  describe('/user/token', function () {
    it('should create user token', async () => {
      const token = await createJwtToken(configuration.api.session.secret, users.john.id, users.john.email);
      let res = await app.request('/user/token', { 
        headers: { Authorization: `Bearer ${token}`}
      });
      expect(res.status).toEqual(200);
      const apiToken = (await res.json()).user.apiToken;
      res = await app.request('/user', { 
        headers: { Authorization: `Bearer ${apiToken}`}
      });
      expect(res.status).toEqual(200);
    });
  });
  
  describe('/user/memberships', function () {
    it('should get cached user memberships', async () => {
      const token = await createJwtToken(configuration.api.session.secret, users.john.id, users.john.email);
      const res = await app.request('/user/memberships', { 
        headers: { Authorization: `Bearer ${token}`}
      });
      expect(res.status).toEqual(200);
      const result = await res.json();
      expect(result.memberships).toHaveLength(2);
      expect(result.memberships.map(m => m.group)).toEqual(expect.arrayContaining(['overseer','tester']));
    });
  });
});

