import {getLogger} from '../services';
import {Client} from '@elastic/elasticsearch';
import {indexCollections, putCollectionMappings} from './indexCollections';
import {inspect} from '../services/utils';

const log = getLogger();
let client;

export async function elasticInit({configuration}) {
  try {
    client = new Client({
      node: configuration.api.elastic.node,
      log: configuration.api.elastic.log
    });
    log.debug('client init')
  } catch (e) {
    log.error(e.message);
  }
}

export async function elasticBootstrap({configuration}) {
  try {
    await client.indices.delete({
      index: '*'
    });
    await putCollectionMappings({configuration, client});
  } catch (e) {
    log.error('------')
    log.error(e.message);
  }
}

export async function elasticIndex({configuration}) {
  try {
    //TODO: move this out to a pluggable file
    await indexCollections({configuration, client});
  } catch (e) {
    log.error(e.message);
    return {error: e.message}
  }
}

export async function search({index, searchBody, explain = false}) {
  try {
    const {body} = await client.search({
      index: index,
      scroll: '10m',
      body: searchBody,
      explain: explain,
    });
    log.debug(JSON.stringify(searchBody));
    return body;
  } catch (e) {
    log.error(e.message);
    return {error: e.message}
  }
}

export async function scroll({scrollId}) {
  try {
    const {body} = await client.scroll({
      scrollId: scrollId,
      scroll: '1m'
    });
    return body;
  } catch (e) {
    log.error(e.message);
    return {error: e.message}
  }
}
