import {getUser} from "./user";
import {createUserMemberships} from "./userMembership";
import {getGroupMembership} from "../services/cilogon"
import {getLogger} from "../services";
import * as utils from "../services/utils";

const log = getLogger();

export async function getCiLogonMemberships({configuration, user}) {
  try {
    log.debug('getCiLogonMemberships');
    const tokenConf = configuration.api.tokens;
    const userDecrytped = {
      id: user.id,
      username: user.providerUsername,
      accessToken: utils.decrypt(tokenConf.secret, user.accessToken),
      accessTokenExpiresAt: user.accessTokenExpiresAt,
      refreshToken: utils.decrypt(tokenConf.secret, user.refreshToken),
    }
    const memberships = await getGroupMembership({
      configuration,
      user: userDecrytped
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
