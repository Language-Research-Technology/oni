import { getLogger } from '../services';
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
    log.debug('No license required');
    return true;
  }
}

