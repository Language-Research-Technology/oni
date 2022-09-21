import {getTeamMembership, filterMemberships, getGroupMembership, getTeamMembershipForUser} from '../services/github';
import {createUserMemberships} from './userMembership';
import * as utils from "../services/utils";

export async function getGithubMemberships({configuration, user, group}) {
  const tokenConf = configuration.api.tokens;
  const username = user.providerUsername;
  const accessToken = utils.decrypt(tokenConf.secret, user.accessToken);
  const teamMembership = await getTeamMembership({
    user: {
      username,
      accessToken
    }, group: group
  });
  if (teamMembership.teams) {
    const userMembership = await getTeamMembershipForUser({
      user: {
        username,
        accessToken
      }, group: group, teams: teamMembership.teams
    });
    const memberships = filterMemberships({teamMembership: userMembership});
    //TODO: Fix this to return DB not the return the service github
    await createUserMemberships({memberships, userId: user.id});
    return memberships;
  } else {
    if (teamMembership.error) {
      return {error: teamMembership.error};
    } else {
      return [];
    }
  }
}

