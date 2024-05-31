import { castArray } from "lodash-es";
import path from 'node:path/posix';
import mime from 'mime';
import { ROCrate } from "ro-crate";
import { Record, RootConformsTo, RootMemberOf, RecordCrateMember, RecordCrateType, RootType } from "../models/index.js";
import { Op, literal } from "sequelize";
import { getLogger } from "../services/logger.js";
import { Readable } from "node:stream";

const log = getLogger();

/**
 * 
 * @param {*} param0 
 * @returns 
 */
export function transformURIs({baseUrl='', crateId='', types, crate}) {
  //log.debug('transformURIs');
  const roc = new ROCrate(crate, {link: true, array: true});
  const rootId = crateId || roc.rootId;
  const entities = [];
  for (const item of roc.entities()) {
    if (types.some(type => item['@type'].includes(type))) {
      entities.push(item);
    }
  }
  for (const item of entities) {
    log.silly(item['@id']);
    //roc.updateEntityId(item['@id'], `${host}/stream?id=${crateId}&path=${item['@id']}`);
    const id = encodeURIComponent(rootId);
    const filePath = item['@id'].split('/').filter(n => n).map(n => encodeURIComponent(n)).join('/');
    roc.updateEntityId(item['@id'], `${baseUrl}/object/${id}/${filePath}`);
  }
  return roc.toJSON();
}


export async function deleteRecords() {
  // Ay nanita
  //This will delete all rocrate records and cascade. If you are re-structuring the database do docker-compose down -v
  try {
    await Record.destroy({ truncate: true, cascade: true });
    // Cascade to true. See index.js for association order. First do the hasMany then the belongsTo
  } catch (e) {
    log.error(e);
    throw new Error(e);
  }
}

const fullInclude = [
  {
    model: RootType,
    attributes: ['recordType'],
    required: true
  },
  {
    model: RootMemberOf,
    attributes: ['memberOf'],
    required: true
  },
  {
    model: RootConformsTo,
    attributes: ['conformsTo'],
    required: true
  }
];

function compactArray(a) {
  return a.length === 1 ? a[0] : a;
}

function denormalize(record) {
  const row = record.toJSON();
  for (const inc of fullInclude) {
    const name = inc.model.tableName;
    const newName = inc.attributes[0];
    const values = row[name].map(r => r[newName]).filter(r => r);
    delete row[name];
    if (values.length) row[newName] = values;
  }
  if (row.conformsTo) row.conformsTo = compactArray(row.conformsTo);
  row.record = { name: row.name, license: row.license, description: row.description };
  return row;
}

export async function getFullRecord({ crateId, attributes }) {
  // if (crateId) where.crateId = crateId;
  // log.silly(crateId);
  const record = await Record.findOne({
    where: { ...(crateId && { crateId }), ...(attributes && { attributes }) },
    include: fullInclude
  });
  if (record) {
    return denormalize(record);
  }
}

function createConditionFromInput(input) {
  // if (!Array.isArray(input)) {
  //   input = [input];
  // }
  const noEmpty = input.filter(e => e);
  const unique = Array.from(new Set(noEmpty));
  if (input.length > noEmpty.length) {
    if (unique.length === 0) {
      return { [Op.is]: null };
    } else {
      return { [Op.or]: { [Op.is]: null, [Op.in]: unique } };
    }
  } else {
    if (unique.length > 1) {
      return unique;
    } else if (unique.length === 1) {
      return unique[0];
    }
  }
  return {};
}
/**
 * 
 * @param {object} opt
 * @param {number} [opt.offset]
 * @param {number} [opt.limit]
 * @param {number} [opt.limit]
 * @param {string[]} [opt.memberOf]
 * @param {string[]} [opt.conformsTo]
 * @returns 
 */
export async function getFullRecords({ offset = 0, limit = 10, memberOf = undefined, conformsTo = undefined } = {}) {
  const params = {
    offset,
    limit,
    order: [],
    attributes: { exclude: ['id'] },
    include: fullInclude,
    distinct: true
  };
  if (memberOf) {
    params.include[1].where = { memberOf: createConditionFromInput(memberOf) };
  } else {
    params.include[1].where = {};
  }
  if (conformsTo) {
    params.include[2].where = { conformsTo: createConditionFromInput(conformsTo) };
  } else {
    params.include[2].where = {};
  }
  let records = await Record.findAndCountAll(params);

  return {
    total: records.count,
    data: records.rows.map(r => denormalize(r))
  };
}

export async function getRecords({ offset = 0, limit = 10 }) {
  let records = await Record.findAndCountAll({
    offset,
    limit,
    order: [],
    attributes: { exclude: ['id'] }
  });
  return {
    total: records.count,
    data: records.rows.map((r) => r.get())
  };
}

export async function getRecord({ crateId }) {
  // if (crateId) where.crateId = crateId;
  // log.silly(crateId);
  const record = await Record.findOne({
    where: { ...(crateId && { crateId }) },
    include: [{
      model: RootConformsTo
    }]
  });
  if (record) {
    return record.get();
  }
}

export async function createRecord({ data, memberOfs, atTypes, conformsTos }) {
  try {
    log.silly(data.crateId)
    if (!data.crateId) {
      return new Error(`Id is a required property`);
    }
    const r = await Record.create({
      locked: false,
      crateId: data.crateId,
      license: data.license,
      name: data.name,
      description: data.description,
      objectRoot: data.objectRoot
    });
    atTypes = castArray(atTypes);
    for (const ele of atTypes) {
      const type = await RootType.create({
        recordType: ele
      });
      await r.addRootType(type);
    }
    memberOfs = castArray(memberOfs);
    for (const ele of memberOfs) {
      const member = await RootMemberOf.create({
        memberOf: ele['@id'],
        crateId: data.crateId
      });
      await r.addRootMemberOf(member);
    }
    // If there is no memberOf it means its an oprhan?
    if (memberOfs.length < 1) {
      const member = await RootMemberOf.create({
        memberOf: null,
        crateId: data.crateId
      });
      await r.addRootMemberOf(member);
    }
    conformsTos = castArray(conformsTos);
    for (const ele of conformsTos) {
      const conformsTo = await RootConformsTo.create({
        conformsTo: ele['@id'],
        crateId: data.crateId
      });
      await r.addRootConformsTo(conformsTo);
    }
  } catch (e) {
    log.error('createRecord');
    log.error(e);
  }
}

export async function createRecordWithCrate(data, hasMembers, atTypes) {
  try {
    log.debug(data.crateId)
    if (!data.crateId) {
      return new Error(`Id is a required property`);
    }
    if (!data.path) {
      return new Error(`Path is a required property`);
    }
    const r = await Record.create({
      locked: false,
      crateId: data.crateId,
      license: data.license,
      name: data.name,
      description: data.description
    });

    for (const hM of hasMembers) {
      const member = await RecordCrateMember.create({
        hasMember: hM['@id']
      });
      await r.addRecordCrateMember(member);
    }
    for (const key of Object.keys(atTypes)) {
      for (const aT of atTypes[key]) {
        const type = await RecordCrateType.create({
          recordType: key,
          crateId: aT['@id']
        });
        await r.addRecordCrateType(type);
      }
    }

  } catch (e) {
    log.error('createRecordWithCrate');
    log.error(e);
  }
}

export async function findRecordByIdentifier({ identifier, recordId }) {
  let clause = {
    where: { identifier },
  };
  if (recordId) {
    clause.include = [
      { model: Record, where: { id: recordId }, attributes: ['id'], raw: true },
    ];
  }
  return await Record.findOne(clause);
}

export async function decodeHash({ id }) {

  // With ARCP like
  // arcp://name,
  // hash it and then find it by it.
}

async function getSingleCrate({ repository, crateId, baseUrl, types, raw, json = false }) {
  // TODO: return a specific version
  log.debug(`getCrate, ${crateId}`);
  const object = repository.object({ id: crateId });
  const crateFile = object.getFile({ logicalPath: 'ro-crate-metadata.json' });
  if (raw) {
    if (json) return JSON.parse(await crateFile.asString());
    else return Readable.toWeb(await crateFile.asStream());
  } else {
    const crate = JSON.parse(await crateFile.asString());
    return transformURIs({baseUrl, crateId, types, crate});
  }
}

export async function getCrate({ repository, crateId, baseUrl, types, raw, deep }) {
  // first get the parent/root
  if (deep) {
    let crate = await getSingleCrate({ repository, crateId, baseUrl, types, raw, json: true });
    let stack = [crateId];
    const rocrate = new ROCrate(crate, {array: true, link: true});
    while (crateId = stack.pop()) {
      // get children id
      const children = await RootMemberOf.findAll({ where: { memberOf: crateId } });
      for (let c of children) {
        crate = await getSingleCrate({ repository, crateId:c.crateId, baseUrl, types, raw, json: true });
        for (let entity of crate['@graph']) {
          if (entity['@id'] && !rocrate.getEntity(entity['@id'])) {
            rocrate.addEntity(entity);
          }
        }
        stack.push(c.crateId);
      }
    }
    return rocrate.toJSON();
  } else {
    return getSingleCrate({ repository, crateId, baseUrl, types, raw });
  }
}

export async function getFile({ crateId, repository, filePath }) {
  try {
    const object = repository.object({ id: crateId });
    await object.load();
    const fileStream = await object.getFile({ logicalPath: filePath }).asStream();
    if (fileStream && filePath) {
      const fileName = path.basename(filePath);
      return {
        objectRoot: object.root,
        fileStream: fileStream,
        filename: fileName,
        filePath: filePath,
        mimetype: mime.getType(fileName) || 'application/octet-stream'
      }
    } else {
      log.error(`File in repository with id: ${crateId} not found in: ${filePath}`);
      log.error(`path: ${filePath}`);
    }
  } catch (e) {
    log.error(`getFile in repository with id: ${crateId} not found in: ${filePath}`);
    log.debug(`path: ${filePath}`);
  }
}

/**
 * Get the path to a file in repository relative to the ocfl root directory
 * @param {*} param0 
 */
export async function getFilePath({ crateId, repository, filePath }) {
  try {
    const object = repository.object(crateId);
    const inv = await object.getInventory();
    const contentPath = inv.getContentPath(inv.getDigest(filePath));
    if (contentPath) {
      const p = '/ocfl/' + repository.objectRoot(crateId) + '/' + contentPath;
      //console.log(p);
      return p;
    }
  } catch (error) {
  }
}

export async function getOauthToken(conf) {
  try {
    const body = {
      grant_type: 'client_credentials',
      client_id: conf.key,
      client_secret: conf.secret,
      scope: 'read'
    };
    log.debug(body);
    let url = `${conf.host}/oauth/token`;
    log.debug(url);
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 200) {
      const json = await response.json();
      return json['access_token'];
    } else {
      log.error('cannot get access token: ', response.status);
    }
  } catch (e) {
    log.error(e.message);
  }
}