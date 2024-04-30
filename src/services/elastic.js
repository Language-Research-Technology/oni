import {first, pullAt} from "lodash-es";
import {checkIfAuthorized} from "./license.js";
import {getLogger} from "./logger.js";

const log = getLogger();

/**
 * At this moment filter results will check on each item result hit and verify its license
 * If it is not authorized it will remove and add basic information
 * @todo Is this what we want? Or should we pullAt if not authorized?
 * @param userId
 * @param results
 * @param configuration
 * @return {Promise<*>}
 */
export async function filterResults({userId, results, configuration}) {
  const itemsToFilter = [];
  for (let index = 0; index < results?.hits?.hits.length; index++) {
    const license = first(results.hits.hits[index]?._source?.license);
    let pass = {hasAccess: false};
    const id = results?.hits?.hits[index]?._source['@id'];
    if (!license) {
      log.warn(`No license information found for ${id}`);
      pass.hasAccess = true;
    } else {
      log.silly(`Checking authorization for ${id} with license: ${license['@id']}`);
      pass = await checkIfAuthorized({userId, license: license['@id'], configuration});
      if (!pass.hasAccess) {
        log.silly(`Not authorized for ${id} with license: ${license['@id']}`);
        //What to do? Do we mutate the array adding a not authorized
        const source = results.hits.hits[index]?._source;
        if (source?._metadataIsPublic) {
          results.hits.hits[index]._source['_access'] = pass;
          //What to do with indexed text in elastic? Delete field or clear it?
          //results.hits.hits[index]._source['_text'] = '';
          delete results.hits.hits[index]._source['_text'];
        } else {
          results.hits.hits[index]._source = {
            '@id': id,
            '@type': source['@type'] || null,
            '_memberOf': source['_memberOf'] || null,
            '_parent': source['_parent'] || null,
            '_crateId': source['_crateId'] || null,
            name: source?.name, //TODO: add pseudonym to names
            license: source?.license,
            error: 'not_authorized',
            _access: pass
          }
        }
        //What to do? Ask Peter; Do we remove the item of the search result with this and pullAt
        //itemsToFilter.push(index);
      } else {
        results.hits.hits[index]._source['_access'] = pass;
      }
    }
  }
  //Put it back if we want to remove items rather than modify its results.
  //pullAt(results.hits.hits, itemsToFilter);
  return results;
}


