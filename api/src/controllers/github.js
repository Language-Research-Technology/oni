import { getUser } from './user';
import { getTeamMembership, filterMemberships } from '../services/github';
import { createUserMemberships } from './userMembership';
import * as utils from "../services/utils";

export async function getGithubMemberships({ configuration, userId, group }) {

  const tokenConf = configuration.api.tokens;
  const user = await getUser({ where: { id: userId } });
  const teamMembership = await getTeamMembership({
    user: {
      username: user.providerUsername,
      accessToken: utils.decrypt(tokenConf.secret, user.accessToken)
    }, group: group
  });
  const memberships = filterMemberships({ teamMembership });
  //TODO: Fix this to return DB not the return the service github
  await createUserMemberships({ memberships, userId });
  return memberships;
}

