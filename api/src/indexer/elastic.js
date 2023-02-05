import {getLogger} from '../services';
import {Client} from '@elastic/elasticsearch';
import {Indexer} from './Indexer';

const log = getLogger();
let client;

export async function elasticInit({configuration}) {
  try {
    client = new Client({
      node: configuration.api.elastic.node,
    });
    log.debug('Init elastic client');
    await configureCluster({configuration, client});
    if (configuration.api?.elastic?.log === 'debug') {
      //For details about observability in elastic index, an event emitter is attached to log the responses
      //ES 7.x -> https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.17/observability.html
      client.on('response', (err, result) => {
        if (err) {
          const error = {
            type: err?.meta?.body?.type,
            message: err?.message,
            meta: err.meta?.body?.error?.caused_by
          };
          log.error(JSON.stringify(error));
        }
      });
    }
  } catch (e) {
    log.error(e.message);
  }
}

export async function elasticBootstrap({configuration}) {
  try {
    await client.indices.delete({
      index: '*'
    });
    await configureMappings({configuration, client});
  } catch (e) {
    log.error('elasticBoostrap');
    log.error(e.message);
  }
}

export async function elasticIndex({configuration, repository}) {
  try {
    //TODO: move this out to a pluggable file
    //await indexCollections({configuration, repository, client});
    const indexer = new Indexer({configuration, repository, client});
    await indexer.indexCollections();
  } catch (e) {
    log.error(e.message);
    return {error: e.message}
  }
}

export async function search({configuration, index, searchBody, explain = false, needsScroll = false}) {
  try {
    const elastic = configuration['api']['elastic'];
    const opts = {
      index: index,
      body: searchBody,
      explain: explain,
    }
    if (needsScroll) {
      opts['scroll'] = elastic?.scrollTimeout || '10m';
    }
    const {body} = await client.search(opts);
    log.debug("----- searchBody ----");
    log.debug(JSON.stringify(searchBody));
    log.debug("----- searchBody ----");
    return body;
  } catch (e) {
    log.error(e.message);
    return {error: e.message}
  }
}

export async function scroll({configuration, scrollId}) {
  try {
    const elastic = configuration['api']['elastic'];
    const {body} = await client.scroll({
      scrollId: scrollId,
      scroll: elastic?.scrollTimeout || '10m'
    });
    return body;
  } catch (e) {
    log.error(e.message);
    return {error: e.message}
  }
}

export async function configureMappings({configuration, client}) {

  //TODO: move this to config
  try {
    log.debug('Configure Mappings');
    const elastic = configuration['api']['elastic'];
    await client.indices.create({
      index: elastic['index'],
      body: {mappings: elastic['mappings']}
    });
    await client.indices.putSettings({
      index: elastic['index'],
      body: {mapping: {total_fields: {limit: elastic['mappingFieldLimit'] || 1000}}}
    });
  } catch (e) {
    log.error('configureMappings');
    log.error(JSON.stringify(e.message));
    throw new Error(e);
  }
}

export async function configureCluster({configuration, client}) {
  log.debug('Configure Cluster');
  try {
    const elastic = configuration['api']['elastic'];
    const settings = {
      "persistent": {
        "search.max_open_scroll_context": elastic?.maxScroll || 5000
      },
      "transient": {
        "search.max_open_scroll_context": elastic?.maxScroll || 5000
      }
    }
    await client.cluster.putSettings({body: settings});
    if (elastic?.log === 'debug') {
      const config = await client.cluster.getSettings();
      log.debug(JSON.stringify(config));
    }
  } catch (e) {
    log.error('configureCluster');
    log.error(JSON.stringify(e.message));
    throw new Error(e);
  }
}

export async function clearScroll({scrollId}) {
  try {
    log.debug(scrollId)
    return await client.clearScroll({scroll_id: scrollId});
  } catch (e) {
    log.error('clearScroll');
    log.error(JSON.stringify(e.message));
    throw new Error(e);
  }
}
