import {getLogger} from "./logger";
import {strict as assert} from 'assert';
import {toArray, forEach} from 'lodash';
import {needsNewToken} from '../routes/auth/oauth2-auth';

const log = getLogger();

export async function getGroupMembership({configuration, user}) {
  try {
    log.debug('getGroupMembership');
    const conf = configuration.api.authentication['cilogon'];
    const accessToken = await needsNewToken({configuration, provider: 'cilogon', user});
    const response = await fetch(conf.user, {
      method: 'POST',
      body: new URLSearchParams({'access_token': accessToken}),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      }
    });
    if (response.status === 200) {
      const userInfo = await response.json();
      assert(conf['memberOf'], 'setup a memberOf field in configuration.api.authentication["cilogon"]');
      //This is to model it to look like and match github api
      const groups = [];
      forEach(userInfo[conf['memberOf']], (g) => {
        groups.push({group: g});
      });
      return groups;
    } else {
      return {error: response.statusText}
    }
  } catch (e) {
    log.error('getGroupMembership');
    log.error(JSON.stringify(e));
    return {error: e};
  }
}
