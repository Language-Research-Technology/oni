import {getLogger} from "../services";
import {getGroupMembership} from "../services/rems";
import {createUserMemberships} from "./userMembership";

const log = getLogger();

export async function getREMSMemberships({configuration, user}) {
  try {
    log.debug('getREMSMemberships');
    const memberships = await getGroupMembership({
      configuration,
      user
    });
    if (memberships.error) {
      return {error: memberships.error}
    } else {
      await createUserMemberships({memberships, userId: user.id});
      return memberships;
    }
  } catch (e) {
    return {error: e}
  }
}
