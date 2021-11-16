const models = require("../models");
const { getLogger } = require("../common");
const { getItem, readCrate } = require("oni-ocfl");
const { OcflObject } = require("ocfl");
const { transformURIs } = require("../common/ro-crate-utils");
const { castArray } = require('lodash');

const log = getLogger();

async function deleteRecords() {
  // Ay nanita
  //This will delete all records and cascade. If you are re-structuring the database do docker-compose down -v
  let record = await models.record.destroy({
    truncate: true, cascade: true
  });
  return record;
}

async function getRecords({ offset = 0, limit = 10 }) {
  let records = await models.record.findAndCountAll({
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

async function getRecord({ crateId }) {
  let where = {};
  if (crateId) where.crateId = crateId;
  log.silly(crateId);
  let record = await models.record.findOne({
    where,
    include: [ {
      model: models.rootConformsTo
    } ]
  });
  if (record) {
    return { data: record.get() }
  } else {
    return { data: null }
  }
}

async function createRecord({ data, memberOfs, atTypes, conformsTos }) {
  try {
    log.silly(data.crateId)
    if (!data.crateId) {
      return new Error(`Id is a required property`);
    }
    if (!data.path) {
      return new Error(`Path is a required property`);
    }
    const r = await models.record.create({
      locked: false,
      crateId: data.crateId,
      path: data.path,
      diskPath: data.diskPath,
      license: data.license,
      name: data.name,
      description: data.description
    });
    atTypes = castArray(atTypes);
    for (const ele of atTypes) {
      const type = await models.rootType.create({
        recordType: ele
      });
      await r.addRootType(type);
    }
    memberOfs = castArray(memberOfs);
    for (const ele of memberOfs) {
      const member = await models.rootMemberOf.create({
        memberOf: ele['@id'],
        crateId: data.crateId
      });
      await r.addRootMemberOf(member);
    }
    conformsTos = castArray(conformsTos);
    for (const ele of conformsTos) {
      const conformsTo = await models.rootConformsTo.create({
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

async function createRecordWithCrate(data, hasMembers, atTypes) {
  try {
    log.debug(data.crateId)
    if (!data.crateId) {
      return new Error(`Id is a required property`);
    }
    if (!data.path) {
      return new Error(`Path is a required property`);
    }
    const r = await models.record.create({
      locked: false,
      crateId: data.crateId,
      path: data.path,
      diskPath: data.diskPath,
      license: data.license,
      name: data.name,
      description: data.description
    });

    for (const hM of hasMembers) {
      const member = await models.recordCrateMember.create({
        hasMember: hM['@id']
      });
      await r.addRecordCrateMember(member);
    }
    for (const key of Object.keys(atTypes)) {
      for (const aT of atTypes[key]) {
        const type = await models.recordCrateType.create({
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

async function findRecordByIdentifier({ identifier, recordId }) {
  let clause = {
    where: { identifier },
  };
  if (recordId) {
    clause.include = [
      { model: models.record, where: { id: recordId }, attributes: [ 'id' ], raw: true },
    ];
  }
  return await models.record.findOne(clause);
}

async function decodeHash({ id }) {

  // With ARCP like
  // arcp://name,
  // hash it and then find it by it.
}

async function getRawCrate({ diskPath, catalogFilename }) {
  const ocflObject = new OcflObject(diskPath);
  const json = await readCrate(ocflObject, catalogFilename);
  return json;
}

async function getUridCrate({ host, crateId, diskPath, catalogFilename, typesTransform }) {
  const ocflObject = new OcflObject(diskPath);
  const newCrate = await transformURIs({
    host,
    crateId: crateId,
    ocflObject,
    uridTypes: typesTransform,
    catalogFilename
  });
  return newCrate;
}

async function getFile({ record, itemId, catalogFilename }) {
  try {
    const ocflObject = new OcflObject(record['diskPath']);
    const filePath = await getItem(ocflObject, catalogFilename, itemId);

    const index = filePath.lastIndexOf("/");
    const fileName = filePath.substr(index);
    const ext = filePath.lastIndexOf(".");
    let extName;
    if (ext) {
      extName = filePath.substr(ext);
    }
    log.debug('getFile: record')
    log.debug(filePath);

    return {
      filename: fileName,
      filePath: filePath,
      mimetype: extName || 'file'
    }
  } catch (e) {
    log.error('getFile');
    return new Error(e);
  }
}

module.exports = {
  deleteRecords: deleteRecords,
  getRecords: getRecords,
  getRecord: getRecord,
  createRecord: createRecord,
  createRecordWithCrate: createRecordWithCrate,
  findRecordByIdentifier: findRecordByIdentifier,
  getRawCrate: getRawCrate,
  getUridCrate: getUridCrate,
  getFile: getFile
}
