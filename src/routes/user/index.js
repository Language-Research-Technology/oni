import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { getLogger } from '../../services/logger.js';
import { getUser } from '../../controllers/user.js';
 //import {getGithubMemberships} from "../../controllers/github.js";
// import {getCiLogonMemberships} from "../../controllers/cilogon";
import { encrypt } from '../../services/utils.js';
import { getUserMemberships } from "../../controllers/userMembership.js";
import { getTerms, termsAggrement, getPersonId, agreeTerms } from '#src/controllers/comanage.js';

const log = getLogger();

export function setupUserRoutes({ configuration, auth }) {
  const app = new Hono({ strict: false });
  app.use(auth);

  /**
   * @openapi
   * /user:
   *   get:
   *     tags:
   *       - user
   *     description: |
   *                  ### User
   *                  Get User Information of the authenticated user
   *     security:
   *       - Bearer: []
   *       - OAuth2:
   *         - openid
   *         - profile
   *         - email
   *         - org.cilogon.userinfo
   *         - offline_access
   *     responses:
   *       '200':
   *         description: Returns user information including Group Membership.
   *       '401':
   *         description: Not authenticated
   *       '403':
   *         description: Access token does not have the required scope
   *
   */
  app.get("/", async (c) => {
    const user = c.get('user');
    if (user) {
      return c.json({user});
    } else {
      return c.notFound();
    }
  });

  /**
   * @openapi
   * /user/token:
   *   get:
   *     tags:
   *       - user
   *     description: |
   *                  ### Get User Token
   *                  Get user token of the authenticated user
   *     security:
   *       - Bearer: []
   *       - OAuth2:
   *         - openid
   *         - profile
   *         - email
   *         - org.cilogon.userinfo
   *         - offline_access
   *     responses:
   *       200:
   *         description: Generates and returns a new apiToken for logged in user
   */
  app.get("/token", async (c) => {
    const user = c.get('user');
    if (user) {
      const tokenConf = configuration.api.tokens;
      const apiToken = uuidv4();
      const userDb = await getUser({id: user.id});
      userDb.apiToken = encrypt(tokenConf.secret, apiToken, tokenConf.accessTokenPassword); //Using the same initVector when encrypted to be able to compare it.
      await userDb.save();
      return c.json({user:{ ...user, apiToken }}, 200);
    } else {
      return c.notFound();
    }
  });

  /**
   * @openapi
   * /user/token:
   *   delete:
   *     tags:
   *       - user
   *     description: |
   *                  ### Del User Token
   *                  Remove token from the authenticated user
   *     responses:
   *       200:
   *         description: Returns user information.
   */
  app.delete("/token", async (c) => {
    const user = c.get('user');
    if (user) {
      const userDb = await getUser({id: user.id});
      userDb.apiToken = null;
      await userDb.save();
      return c.body(null, 204);
    } else {
      return c.notFound();
    }
  });

  /**
   * @openapi
   * /user/memberships:
   *   get:
   *     tags:
   *       - user
   *     description: |
   *                  ### Retrieves User Memberships
   *                  gets the memberships of authenticated user. This is different to /auth/memberships as it only checks for current memberships. Use /auth/memberships to update /user/memberships
   *     security:
   *       - Bearer: []
   *       - OAuth2:
   *         - openid
   *         - profile
   *         - email
   *         - org.cilogon.userinfo
   *         - offline_access
   *     responses:
   *       200:
   *         description: Generates and returns a new apiToken for logged in user
   */
  app.get('/memberships', async (c) => {
    const user = c.get('user');
    log.debug('checking memberships -User: ' + user?.id);
    if (user) {
      const memberships = await getUserMemberships({ where: { userId: user.id } });
      if (memberships.error) {
        return c.json({ memberships: [], error: memberships.error });
      } else {
        return c.json({ memberships });
      }
    } else {
      return c.notFound();
    }
  });

  app.get('/terms', async (c) => {
    try{
    const user = c.get('user');
    if (user) {
      log.debug('checking accepted terms -User: ' + user?.id);
      console.log(user);
      const personId = await getPersonId({configuration, user});
      const agreement = await termsAggrement({ configuration, personId });
      console.log(agreement);
      if(!agreement) {
        const terms = await getTerms({ configuration });
        return  c.json({terms});
      } else {
        return c.json({terms: false});
      }
    } else {
      return c.notFound();
    }
    }catch (e) {
      return c.json({error: e.message});
    }
  });

  app.get('/terms/accept', async (c) => {
    const user = c.get('user');
    if (user) {
      log.debug('checking accepted terms -User: ' + user?.id);
      console.log(user);
      const personId = await getPersonId({configuration, user});      
      const terms = await agreeTerms({ configuration, personId });
      console.log(terms);
      return c.json({accept: true});
    } else {
      return c.notFound();
    }
  });

  return app;
}
