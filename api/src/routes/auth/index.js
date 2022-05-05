import {getLogger} from "../../services";
import {setupGithubRoutes} from './github';
import {getUser} from '../../controllers/user';
import sessions from 'client-sessions';
import models from '../../models';
import {UnauthorizedError} from 'restify-errors';
import {getGithubMemberships} from '../../controllers/github';
import {getCiLogonMemberships} from '../../controllers/cilogon';
import {setupLoginRoutes} from './openid-auth';
import {setupOauthRoutes} from './oauth2-auth';
import {routeUser, routeAdmin, routeBearer} from '../../middleware/auth';

const log = getLogger();

export function setupAuthRoutes({server, configuration}) {

  server.get('/authenticated',
    routeUser(async (req, res, next) => {
      log.debug('is authenticated');
      res.json({authenticated: true});
      next();
    })
  );

  server.get('/logout', async (req, res, next) => {
    if (req.headers.authorization) {
      let token = req.headers.authorization.split("Bearer ")[1];
      if (token) {
        let session = await models.session.findOne({where: {token}});
        if (session) await session.destroy();
      }
    }
    next(new UnauthorizedError());
  });

  /*
   * TODO: How to setup your social login dynamically
  */
  setupLoginRoutes({server, configuration});
  setupOauthRoutes({server, configuration});

  server.get('/auth/memberships',
    routeUser(async function (req, res, next) {
      log.debug('User: ' + req.session?.user?.id);
      if (!req.session?.user?.id) {
        res.json({accessDenied: true});
        next(new UnauthorizedError());
      } else {
        // TODO: Design group configuration
        const group = configuration['api']['licenseGroup'];
        // TODO: load dynamically the memberships functions
        let memberships = [];
        const user = await getUser({where: {id: req.session?.user?.id}});
        log.debug(`user?.provider ${user?.provider}`);
        if (user?.provider === 'github') {
          memberships = await getGithubMemberships({userId: user.id, group});
        } else if (user?.provider === 'cilogon') {
          memberships = await getCiLogonMemberships({configuration, user, group})
        }
        if (memberships.error) {
          res.status(401);
          res.json({error: memberships.error});
          next(new UnauthorizedError());
        } else {
          res.json({memberships});
          next();
        }
      }
    })
  )
}
