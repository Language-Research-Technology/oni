import {getLogger} from "./logger";
import {forEach, uniqBy} from "lodash";

const log = getLogger();

export async function getGroupMembership({configuration, user}) {
  try {
    log.debug('getGroupMembership');
    const conf = configuration.api.authorization['rems'];
    const params = new URLSearchParams();
    params.append('user', user.providerUsername); // Must be a rems user id, it will be ignored if the user does not have enough privileges
    // params.append('expired', false); // Optional to include expired entitlements
    // params.append('resource', resource); // Placing it here so as a reminder that we can use it.
    const response = await fetch(`${conf.apiHost}/entitlements?user=${encodeURIComponent(user.providerUsername)}`, {
      headers: {
        'x-rems-api-key': conf.apiKey,
        'x-rems-user-id': conf.apiUser,
        'Content-Type': 'application/json;charset=UTF-8'
      }
    });
    if (response.status === 200) {
      const userInfo = await response.json();
      const groups = [];
      console.log('------')
      log.debug(JSON.stringify(userInfo));
      console.log('------')
      forEach(userInfo, (g) => {
        groups.push({group: g["resource"]});
      });
      const uniqueGroups = uniqBy(groups, "group");
      return uniqueGroups;
    } else {
      return {error: response.statusText}
    }
  } catch (e) {
    log.error('getGroupMembership');
    log.error(JSON.stringify(e));
    return {error: e};
  }
}
