import {getLogger} from '../../services';
import {isUndefined} from 'lodash';
import {getUser, updateUser} from '../../controllers/user';
import {v4 as uuidv4} from 'uuid';
import {routeUser} from '../../middleware/auth';
import {getGithubMemberships} from "../../controllers/github";
import {getCiLogonMemberships} from "../../controllers/cilogon";
import * as utils from '../../services/utils';
import {UnauthorizedError} from "restify-errors";
import {getUserMemberships} from "../../controllers/userMembership";

const log = getLogger();

export function setupUserRoutes({server, configuration}) {

  /**
   * @openapi
   * /user:
   *   get:
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
  server.get("/user", routeUser(async (req, res, next) => {
      try {
        if (req.session.user) {
          const user = await getUser({where: {id: req.session.user.id}});
          user['apiToken'] = null;
          user['accessToken'] = '....removed';
          res.status(200);
          res.json({user});
        } else {
          res.status(200);
          res.json({user: null});
        }
      } catch (e) {
        log.error(e);
        res.send({error: e['message']}).status(500);
        next();
      }
    })
  );

  /**
   * @openapi
   * /user/token:
   *   get:
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
  server.get("/user/token", routeUser(async (req, res, next) => {
      try {
        if (req.session.user) {
          const tokenConf = configuration.api.tokens;
          const id = req.session.user.id;
          const apiToken = uuidv4();
          const user = await updateUser({
            where: {where: {id: id}},
            key: 'apiToken',
            value: utils.encrypt(tokenConf.secret, apiToken, tokenConf.accessTokenPassword) //Using the same initVector when encrypted to be able to compare it.
          });
          user['accessToken'] = '...removed';
          user['refreshToken'] = '...removed';
          user['apiToken'] = apiToken; //Returns in plain text for consuming
          res.json({user}).status(200);
        } else {
          res.json({user: null}).status(200);
        }
      } catch (e) {
        log.error(e);
        res.send({error: e['message']}).status(500);
        next();
      }
    })
  );
  /**
   * @openapi
   * /:
   *   del:
   *     description: |
   *                  ### Del User Token
   *                  Remove token from the authenticated user
   *     responses:
   *       200:
   *         description: Returns user information.
   */
  server.del("/user/token", routeUser(async (req, res, next) => {
      try {
        if (req.session.user) {
          const id = req.session.user.id;
          const user = await updateUser({
            where: {where: {id: id}},
            key: 'apiToken',
            value: null
          });
          user['accessToken'] = '...removed';
          user['refreshToken'] = '...removed';
          res.json({user});
        } else {
          res.json({user: null});
        }
      } catch (e) {
        log.error(e);
        res.status(500);
        res.send({error: e['message']})
        next();
      }
    })
  );

  /**
   * @openapi
   * /user/memberships:
   *   get:
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
  server.get('/user/memberships',
    routeUser(async function (req, res, next) {
      log.debug('checking memberships');
      log.debug('User: ' + req.session?.user?.id);
      if (!req.session?.user?.id) {
        res.json({accessDenied: true});
        next(new UnauthorizedError());
      } else {
        const user = await getUser({where: {id: req.session?.user?.id}});
        const memberships = await getUserMemberships({where: {userId: user.id}});
        if (memberships.error) {
          res.json({memberships: [], error: memberships.error});
        } else {
          res.json({memberships});
          next();
        }
      }
    })
  );
}
