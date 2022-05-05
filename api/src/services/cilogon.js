import FormData from 'form-data';
import {getLogger} from "./logger";
import {strict as assert} from 'assert';
import {toArray, forEach} from 'lodash';

const log = getLogger();

export async function getGroupMembership({configuration, user}) {
  try {
    log.debug('getGroupMembership');
    const conf = configuration.api.authentication['cilogon'];
    const formData = new FormData();
    formData.append('access_token', user['accessToken'] || 'NA');
    const response = await fetch(conf.user, {
      method: 'POST',
      body: new URLSearchParams({'access_token': user['accessToken'] || 'NA'}),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      }
    });
    const userInfo = await response.json();
    assert(conf['memberOf'], 'setup a memberOf field in configuration.api.authentication["cilogon"]');
    //This is to model it to look like and match github api
    const groups = [];
    forEach(userInfo[conf['memberOf']], (g) => {
      groups.push({group: g});
    });
    return groups;
  } catch (e) {
    return {error: e};
  }
}
