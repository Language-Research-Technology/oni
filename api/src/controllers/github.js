import { getUser } from './user';
import { getTeamMembership, filterMemberships } from '../services/github';
import { createUserMemberships } from './userMembership';

export async function getGithubMemberships({ userId, group }) {

  const user = await getUser({ where: { id: userId } });
  const teamMembership = await getTeamMembership({
    user: {
      username: user.providerUsername,
      accessToken: user.accessToken
    }, group: group
  });
  const memberships = filterMemberships({ teamMembership });
  //TODO: Fix this to return DB not the return the service github
  await createUserMemberships({ memberships, user });
  return memberships;
}

