import { Client } from '@opensearch-project/opensearch';
import { Indexer } from "./indexer.js";
import { logger } from "#src/services/logger.js";

export class SearchIndexer extends Indexer {
  conf;
  defaultLicense;
  defaultMetadataLicense;
  /** @type {Client} */
  client;
  conformsTo;
  constructor({ configuration }) {
    super();
    this.defaultLicense = configuration.api.license?.default?.['@id'];
    this.defaultMetadataLicense = configuration.api?.license?.defaultMetadata;
    this.conf = configuration.api.elastic || {};
    this.client = new Client({ node: configuration.api.elastic.node });
    this.conformsTo = {
      [configuration.api.conformsTo.collection]: mapCollection,
      [configuration.api.conformsTo.object]: mapObject
    };
  }

  async init() {
    logger.debug('Configure OpenSearch Cluster');
    try {
      const elastic = this.conf;
      const settings = {
        "persistent": {
          "search.max_open_scroll_context": elastic?.maxScroll || 5000
        },
        "transient": {
          "search.max_open_scroll_context": elastic?.maxScroll || 5000
        }
      }
      await this.client.cluster.putSettings({ body: settings });
      if (elastic?.log === 'debug') {
        const config = await this.client.cluster.getSettings();
        logger.debug('Current cluster setting: ' + JSON.stringify(config));
      }
      try {
        await this.client.indices.create({
          index: elastic.index,
          body: {
            max_result_window: elastic.max_result_window,
            mappings: elastic.mappings
          }
        });
        await this.client.indices.putSettings({
          index: elastic.index,
          body: elastic.indexConfiguration
        });
      } catch (error) {
        //logger.debug('search index already exists, ignore');
        //logger.debug(error);
      }

    } catch (e) {
      logger.error('configureCluster');
      logger.error(JSON.stringify(e.message));
    }
  }

  async delete() {
    try {
      await this.client.indices.delete({ index: this.conf.index });
    } catch (e) {
      logger.debug(e.message);
    }
  }

  async count() {
    try {
      const res = await this.client.count({ index: this.conf.index });
      return res.body.count;
    } catch (e) {
      logger.error(e.message);
    }
  }

  async search({ index = this.conf.index, searchBody, filterPath = undefined, explain = false }) {
    try {
      logger.debug("----- searchBody ----");
      logger.debug(JSON.stringify(searchBody));
      logger.debug("----- searchBody ----");
      const opts = {
        index,
        body: searchBody,
        explain: explain,
      }
      if (filterPath) {
        opts['filter_path'] = filterPath
      }
      logger.debug(JSON.stringify(opts));
      const result = await this.client.search(opts);
      return result.body;
    } catch (e) {
      logger.error(e.message);
      throw new Error(e.message);
    }
  }

  /**
   * 
   * @param {object} p
   * @param {any} p.ocflObject
   * @param {import('ro-crate').ROCrate} p.crate
   * @param {any} p.rootDataset
   * @returns 
   */
  async _index({ ocflObject, crate }) {
    let root = crate.getTree({ root: crate.rootDataset, depth: 0 });
    root = Object.fromEntries(['@id', '@type', 'name'].map(k => [k, root[k]]));
    const indexedIds = new Set();
    /** @typedef {typeof crate.rootDataset} Entity */
    /** @typedef {[Entity, Entity[]]} EntityParentsTuple */
    /** @type {EntityParentsTuple[]} */
    const stack = [[crate.rootDataset, []]];
    let entry;
    while (entry = stack.pop()) {
      const [entity, parents] = entry;
      const id = entity['@id'];
      if (!indexedIds.has(id)) {
        indexedIds.add(id);
        const indexed = await this._indexEntity({ ocflObject, crate, entity, parents, root });
        if (indexed) {
          logger.debug('Indexed ' + crate.rootId + ', entity=' + id);
          for (const f of entity.indexableText || []) {
            f.__$contentIndexable = true;
          }
          for (let members of [entity.hasMember || [], entity['@reverse'].memberOf || []]) {
            for (let member of members) {
              if (!member.memberOf || !member.memberOf.length) member.memberOf = { '@id': crate['@id'] };
              stack.push([member, [...parents, entity]]);
            }
          }
          for (let parts of [entity.hasPart || [], entity['@reverse'].partOf || []]) {
            for (let part of parts) {
              if (!part.partOf || !part.partOf.length) part.partOf = { '@id': crate['@id'] };
              stack.push([part, [...parents, entity]]);
            }
          }
        }
      }
    }
  }

  async _indexEntity({ ocflObject, crate, entity, parents = [], root }) {
    const indexTypes = (entity.conformsTo || []).
      map((node) => this.conformsTo[node['@id'] || node]).
      filter((v, i, a) => v && a.indexOf(v) === i);
    const isFile = entity['@type'].includes('File');
    if (indexTypes.length || isFile) {
      const parent = parents.at(-1)?.toJSON();
      const crateId = crate.rootId;
      const entityId = entity['@id'];
      const license = resolveLicense(entity.license || parent?.license, crate, this.defaultLicense);
      if (!license) {
        logger.error(`Skip indexing ${crateId} > ${entityId}, No License Found`);
        return;
      }
      entity.licence = license;
      entity._crateId = crateId;
      const doc = crate.getTree({ root: entity, depth: 1, allowCycle: false });
      if (doc.memberOf && doc.memberOf.length) {
        doc._memberOf = doc.memberOf = pickBasic(doc.memberOf);
      } else {
        doc._isTopLevel = "true";
      }
      doc._root = root;
      if (parent) doc._parent = pickBasic(parent);
      doc._collectionStack = parents.map(e => ({ '@id': e['@id'] })); //todo: filter by collection
      const metadataLicense = resolveMetadataLicense(crate, this.defaultMetadataLicense);
      doc._metadataIsPublic = metadataLicense?.metadataIsPublic;
      doc._metadataLicense = metadataLicense;
      indexGeoLocation({entity, doc});
      for (const index of indexTypes) {
        index();
      }
      if (isFile) {
        indexFile({ entity, doc, ocflObject });
      }
      try {
        const { body } = await this.client.update({
          index: this.conf.index,
          id: entityId.startsWith(crateId) ? entityId : crateId + '/' + entityId,
          body: {
            doc,
            doc_as_upsert: true
          },
          refresh: true
        });
        if (body) return true;
      } catch (e) {
        logger.error('Error indexing ' + crateId + ', entity=' + entityId);
        logger.error(JSON.stringify(e));
      }
    } else {
      logger.info(`[${crate.rootId}] No valid conformsTo found, not indexing ${entity['@id']}`);
    }
  }

}
//elastic.index().then(() => isRunningElastic = false);
// elasticInit({configuration});
// elasticBootstrap({configuration});
// elasticIndex({configuration, repository});

/**
 * Copy one or more properties from exisiting object
 * @param {string[]} props An array of prop names
 * @param {object} obj Object to copy from
 * @returns {object} 
 */
function pick(props, obj = {}) {
  return Object.fromEntries(props.filter(k => k in obj).map(k => [k, obj[k]]));
}

function pickBasic(obj) {
  return pick(['@id', '@type', 'name'], obj);
}

function mapCollection() {

}

function mapObject() {
  // normalItem._subCollection = clone(collectionStack);
  // normalItem._mainCollection = clone(collectionStack);
  // remove(normalItem._subCollection, i => first(root)?.['@id'] === i['@id']);
  // remove(normalItem._mainCollection, i => first(root)?.['@id'] !== i['@id']);
}

async function indexFile({ entity, doc, ocflObject }) {
  const entityId = entity['@id'];
  logger.debug(`Index File: ${entityId}`);
  doc.partOf = pickBasic(doc.partOf);
  if (entity.__$contentIndexable[0] && allowTextIndex(entity)) {
    const isText = entity.encodingFormat?.some(ef => (typeof ef === 'string') && ef.startsWith('text/'));
    if (!isText) return;
    try {
      doc._text = await ocflObject.getFile({ logicalPath: entityId }).asString();
      logger.info(`[${doc._crateId}] Indexing: ${entityId}`);
    } catch (e) {
      logger.error(`[${doc._crateId}] Cannot read file: ${entityId}`);
      logger.error(e.message);
      doc._error = 'file_not_found';
    }
  }
}

function allowTextIndex(entity) {
  return entity.license?.some(l => allowTextIndex?.[0]);
}
/**
 * Find the license of an item with its id if not and id or undefined return a default license from
 * config, if passed an Id and not found it will also return a default license.
 * @param {object[]} licenses - Array of licences
 * @param {import('ro-crate').ROCrate} crate
 * @returns a license object
 *
 */
function resolveLicense(licenses, crate, defaultLicense) {
  for (const license of (licenses || [])) {
    const id = typeof license === 'string' ? license : license?.['@id'];
    const entity = crate.getEntity(id);
    if (entity) {
      return entity;
    }
    logger.warn(`Invalid license: ${id}`);
  }
  return defaultLicense;
}

function resolveMetadataLicense(crate, defaultMetadataLicense) {
  const metadataDescriptorLicense = crate.getEntity('ro-crate-metadata.json')?.license || [];
  const license = metadataDescriptorLicense[0];
  if (license) {
    return {
      metadataIsPublic: license.metadataIsPublic?.[0] || false,
      name: license.name?.[0],
      id: license['@id'],
      description: license.description?.[0]
    }
  } else {
    //default to cc-by-4
    return defaultMetadataLicense;
  }
}

function indexGeoLocation({ entity, doc }) {
  var geolocation = doc._geolocation = ['contentLocation', 'spatialCoverage'].flatMap( prop => {
    let result = [];
    if (entity[prop]) {
      result = doc['_' + prop] = entity[prop].flatMap(place => place.geo.flatMap(g => g.asWKT));
    }
    return result;
  });
  doc._centroid = geolocation.map(calculateCentroid);
}

function calculateCentroid(wkt=[]) {
  // extract all coordinates from wkt string into a flat array
  var coordinates = wkt.replace(/(^\w+\s+)|[()]/g,'').split(',').
    map(e => e.trim().split(/\s+/).map(n => +n));
  var len = coordinates.length;
  if (len) {
    var [sumLng, sumLat] = coordinates.reduce((sum, point) => sum.map((n,i) => n + point[i]), [0,0]);
    var centroid = [sumLng/len, sumLat/len];
    return `POINT (${centroid[0]} ${centroid[1]})`;
  }
}
