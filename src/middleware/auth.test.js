import { Hono } from 'hono';
import { authorizationHeader, authenticateUser } from './auth.js';
import { encrypt } from '../services/utils.js';
import { User } from '../models/user.js';
import { sign } from 'hono/jwt';
import { createJwtToken } from '#src/test-utils.js';

describe('auth middleware', function () {
  var users;
  var secret, tokenSecret, tokenPassword;
  before(function () {
    users = this.users;
    secret = this.configuration.api.session.secret;
    tokenSecret = this.configuration.api.tokens.secret;
    tokenPassword = this.configuration.api.tokens.accessTokenPassword;
  });

  describe('authorizationHeader', function () {
    const app = new Hono();
    app.use(authorizationHeader());
    app.get('/test', c => c.text(c.get('bearer')));

    it('should parse and pass correct bearer token', async function () {
      const token = '123abc';
      const res = await app.request('/test', {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(res.status).toEqual(200);
      const r = await res.text();
      expect(r).toEqual(token);
    });
    it('should fail malformed or missing bearer token', async function () {
      let res = await app.request('/test', {
        headers: { Authorization: 'BadHeader' }
      });
      expect(res.status).toEqual(200);
      expect(await res.text()).toBeFalsy();
      res = await app.request('/test');
      expect(res.status).toEqual(200);
      const r = await res.text();
      expect(r).toBeFalsy();
    });
  });
  describe('authorizationHeader, isRequired=true', function () {
    const app = new Hono();
    app.use(authorizationHeader(true));
    app.get('/test', c => c.text(c.get('bearer')));
    it('should fail invalid token', async function () {
      let res = await app.request('/test', {
        headers: { Authorization: 'BadHeader' }
      });
      expect(res.status).toEqual(400);
      res = await app.request('/test');
      expect(res.status).toEqual(401);
    });
  });

  describe('authenticateUser', function () {
    var resUser, app;
    before(function(){
      app = new Hono();
      //console.log({ secret, tokenSecret, tokenPassword });
      app.use(authenticateUser({ secret, tokenSecret, tokenPassword }));
      app.get('/test', c => (resUser = c.get('user'), c.text('ok')));
    });

    it('should pass valid user, api token', async function () {
      const token = 'john-api-token';
      const res = await app.request('/test', {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(res.status).toEqual(200);
      expect(resUser).toBeDefined();
      expect(resUser.id).toEqual(users.john.id);
    });

    it('should pass valid user, jwt', async function () {
      const token = await createJwtToken(secret, users.john.id);
      const res = await app.request('/test', {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(res.status).toEqual(200);
      expect(resUser.id).toEqual(users.john.id);
    });

    it('should fail valid jwt token of unregistered users', async () => {
      const id = 'test@test.com';
      const token = await createJwtToken(secret, id);
      const res = await app.request('/test', {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(res.status).toEqual(200);
      expect(resUser).toBeFalsy();
    });

    it('should fail invalid token', async function () {
      let res = await app.request('/test', {
        headers: { Authorization: 'Bearer invalidtoken' }
      });
      expect(res.status).toEqual(200);
      expect(resUser).toBeFalsy();
    });

  });

  describe('authenticateUser, isRequired=true', function () {
    before(function () {
      const app = this.app = new Hono();
      app.use(authenticateUser({ secret, tokenSecret, tokenPassword, isRequired: true }));
      app.get('/test', c => c.text('ok'));
    });
    it('should fail invalid token', async function () {
      let res = await this.app.request('/test', {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      expect(res.status).toEqual(401);
    });
  });

});

