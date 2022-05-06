import {getUser} from "./user";
import {createUserMemberships} from "./userMembership";
import {getGroupMembership} from "../services/cilogon"
import {getLogger} from "../services";

const log = getLogger();

export async function getCiLogonMemberships({configuration, user}) {
  try {
    log.debug('getCiLogonMemberships');
    const memberships = await getGroupMembership({
      configuration,
      user: {
        username: user.providerUsername,
        accessToken: user.accessToken
      }
    });
    if (memberships.error) {
      return {error: memberships.error}
    } else {
      await createUserMemberships({memberships, user});
      return memberships;
    }
  } catch (e) {
    return {error: e}
  }
}
