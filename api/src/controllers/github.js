import {
  getOctoKit,
  filterMemberships,
  getTeamMembershipForUser,
  getTeamsOfOrg
} from '../services/github';
import {createUserMemberships} from './userMembership';
import * as utils from "../services/utils";
import {getLogger} from "../services";
const log = getLogger();

export async function getGithubMemberships({configuration, user, group}) {
  const tokenConf = configuration.api.tokens;
  const username = user.providerUsername;
  log.debug(`Get Github Memberships from: ${username}`);
  console.log(user.accessToken)
  const accessToken = utils.decrypt(tokenConf.secret, user.accessToken);
  console.log(accessToken)
  let octokit;
  try {
    octokit = await getOctoKit(accessToken);
  }catch (e) {
    // TODO: should need a refresh token
    console.log(e);
    return {error: e.mesage}
  }
  const teamMembership = await getTeamsOfOrg({octokit, group});
  if (teamMembership.teams) {
    const userMembership = await getTeamMembershipForUser({
      octokit, username, group: group, teams: teamMembership.teams
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

