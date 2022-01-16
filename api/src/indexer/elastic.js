import { getLogger } from '../services';
import { Client } from '@elastic/elasticsearch';
import { indexCollections } from './indexCollections';

const log = getLogger();
let client;

export async function elasticInit({ configuration }) {
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

export async function elasticBootstrap({ configuration }) {
  try {
    await client.indices.delete({
      index: '*'
    });
  } catch (e) {
    log.error(e.message);
  }
}

export async function elasticIndex({ configuration }) {
  try {
    //TODO: move this out to a pluggable file
    await indexCollections({ configuration, client });
  } catch (e) {
    log.error(e.message);
    return { error: e.message }
  }
}

export async function search({ index, query }) {
  try {
    const { body } = await client.search({
      index: index,
      body: {
        query: query
      }
    });
    return body;
  } catch (e) {
    log.error(e.message);
    return { error: e.message }
  }
}
