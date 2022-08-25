import {getTeamMembership, filterMemberships} from '../services/github';
import {createUserMemberships} from './userMembership';
import * as utils from "../services/utils";

export async function getGithubMemberships({configuration, user, group}) {
  console.log('getGithubMemberships');
  const tokenConf = configuration.api.tokens;
  const teamMembership = await getTeamMembership({
    user: {
      username: user.providerUsername,
      accessToken: utils.decrypt(tokenConf.secret, user.accessToken)
    }, group: group
  });
  if (teamMembership.error) {
    return {error: teamMembership.error};
  } else {
    const memberships = filterMemberships({teamMembership});
    //TODO: Fix this to return DB not the return the service github
    await createUserMemberships({memberships, userId: user.id});
    return memberships;
  }
}

