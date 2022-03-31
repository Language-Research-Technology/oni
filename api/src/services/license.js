import { getLogger } from '../services';
import {getUserMemberships} from "../controllers/userMembership";
const log = getLogger();

export function isAuthorized({ memberships, license, licenseConfiguration }) {
  const needsLicense = licenseConfiguration.find(l => l['license'] === license);
  if (needsLicense) {
    const foundAuthorization = memberships.find(membership => {
      const group = membership['group'];
      return group === needsLicense['group'];
    });
    //If just for debugging!
    if (foundAuthorization) {
      log.debug(`Found Authorization: ${ foundAuthorization['group'] }`);
      return true;
    } else {
      return false
    }
  } else {
    log.silly(`Not required or not configured for ${license}`);
    return true;
  }
}

export async function checkIfAuthorized({userId, license, configuration}) {
  let pass = false;
  if (configuration['api']['licenses'] && license) {
    //Doing this so, it works without any sort of user authorization for the collections that can be.
    //The licenses are not checked if not in your configuration file.
    let memberships = [];
    if (userId) {
      memberships = await getUserMemberships({where: { userId }});
    }
    pass = isAuthorized({
      memberships,
      license: license,
      licenseConfiguration: configuration['api']['licenses']
    });
  } else {
    pass = true;
  }
  return pass;
}
