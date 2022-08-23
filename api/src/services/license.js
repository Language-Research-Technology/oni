import { getLogger } from '../services';
import {getUserMemberships} from "../controllers/userMembership";
const log = getLogger();

export function isAuthorized({ memberships, license, licenseConfiguration }) {
  const needsLicense = licenseConfiguration.find(l => l['license'] === license);
  log.silly(`isAuthorized: needsLicense ${JSON.stringify(needsLicense)}`);
  if (needsLicense) {
    const foundAuthorization = memberships.find(membership => {
      const group = membership['group'];
      log.silly(group);
      return group === needsLicense['group'];
    });
    //If just for debugging!
    if (foundAuthorization) {
      log.silly(`Found Authorization: ${ foundAuthorization['group'] }`);
      return {hasAccess: true, group: needsLicense['group']};
    } else {
      return {hasAccess: false, group: needsLicense['group']};
    }
  } else {
    log.silly(`Not required or not configured for ${license}`);
    return {hasAccess: true};
  }
}

export async function checkIfAuthorized({userId, license, configuration}) {
  let access = {hasAccess: false};
  // if(license && license['metadataIsPublic'] === false) {
  //   access.hasAccess = false;
  // }
  if (configuration['api']['licenses'] && license) {
    //Doing this so, it works without any sort of user authorization for the collections that can be.
    //The licenses are not checked if not in your configuration file.
    let memberships = [];
    if (userId) {
      memberships = await getUserMemberships({where: { userId }});
    }
    access = isAuthorized({
      memberships,
      license: license,
      licenseConfiguration: configuration['api']['licenses']
    });
  }
  return access;
}
