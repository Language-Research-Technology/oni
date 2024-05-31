//import { loadConfiguration, generateToken } from '../services/index.js';
//import { User } from '../models/user.js';
import { createJwtToken } from '#src/test-utils.js';
import { setupRoutes } from "#src/routes/index.js";

describe('base path', function () {
  /** @type {import('hono').Hono} */
  var app;
  before(function () {
    const configuration = JSON.parse(JSON.stringify(this.configuration));
    configuration.api.basePath = '/api';
    app = setupRoutes({configuration, repository: {}});
  });

  it('can correctly handle base path', async () => {
    const res = await app.request('/api/version');
    expect(res.status).toEqual(200);
  });
});

describe('Test end point /', function () {
  /** @type {import('hono').Hono} */
  var app;
  /** @type {import('../services/configuration.js').Configuration} */
  var configuration;
  var users;
  before(function () {
    app = this.app;
    configuration = this.configuration;
    users = this.users;
  });

  describe('/configuration', function () {
    it('should be able to show the ui configuration for the environment', async () => {
      const res = await app.request('/configuration');
      expect(res.status).toEqual(200);
      const r = await res.json()
      expect(r).toHaveProperty('ui');
      expect(r.ui.conformsTo).toEqual(configuration.api.conformsTo);
    });
  });

  describe('/version', function () {
    it('should output right version', async () => {
      const res = await app.request('/version');
      expect(res.status).toEqual(200);
      const r = await res.json()
      expect(r.version).toEqual(configuration.package.version);
    });
  });

  describe("/authenticated", function () {
    it("should pass authenticated user", async () => {
      const token = await createJwtToken(configuration.api.session.secret, users.john.id, users.john.email);
      const res = await app.request('/authenticated', {
        headers: { Authorization: `Bearer ${token}`}
      });
      expect(res.status).toBe(200);
    });
    it("should fail requests with no auth header", async () => {
      const res = await app.request('/authenticated');
      expect(res.status).toEqual(401);
    });
    it("should fail requests with wrong auth header", async () => {
      const res = await app.request('/authenticated', { 
        headers: { Authorization: "Bearer xxx"}
      });
      expect(res.status).toEqual(401);
    });
  });
  
  describe("/logout", function () {
  });
});

