import {getUser} from "./user";
import {createUserMemberships} from "./userMembership";

export async function getCiLogonMemberships({ userId, group }) {

  const user = await getUser({where: {id: userId}});
  const groupMembership = await getCiLogonGroupMembership({
    user: {
      username: user.providerUsername,
      accessToken: user.accessToken
    }, group: group
  })
  let memberships = [];
  await createUserMemberships({ memberships, user });
  return memberships;
};
