const models = require("../models");
const { getLogger } = require("../common");
const { getItem, readCrate } = require("oni-ocfl");
const { OcflObject } = require("ocfl");
const { transformURIs } = require("../common/ro-crate-utils");
const { castArray } = require('lodash');

const log = getLogger();

async function deleteRecords() {
  // Ay nanita
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
  });
  return {
    total: records.count,
    data: records.rows.map((r) => r.get())
  };
}

async function getRecord({ recordId }) {
  let where = {};
  if (recordId) where.arcpId = recordId;
  log.debug(recordId);
  let record = await models.record.findOne({
    where,
  });
  if (record) {
    return record;
  }
  return { recordId: recordId, message: 'Not Found' }
}

async function createRecord(data, memberOfs, atTypes) {
  try {
    log.debug(data.arcpId)
    if (!data.arcpId) {
      return new Error(`Id is a required property`);
    }
    if (!data.path) {
      return new Error(`Path is a required property`);
    }
    const r = await models.record.create({
      locked: false,
      arcpId: data.arcpId,
      path: data.path,
      diskPath: data.diskPath,
      license: data.license,
      name: data.name,
      description: data.description
    });
    atTypes = castArray(atTypes);
    for (const key of atTypes) {
      const type = await models.rootType.create({
        recordType: key
      });
      await r.addRootType(type);
    }
    memberOfs = castArray(memberOfs);
    for (const hM of memberOfs) {
      const member = await models.rootMemberOf.create({
        memberOf: hM['@id'],
        crateId: data.arcpId
      });
      await r.addRootMemberOf(member);
    }
  } catch (e) {
    log.error('createRecord');
    log.error(e);
  }
}

async function createRecordWithCrate(data, hasMembers, atTypes) {
  try {
    log.debug(data.arcpId)
    if (!data.arcpId) {
      return new Error(`Id is a required property`);
    }
    if (!data.path) {
      return new Error(`Path is a required property`);
    }
    const r = await models.record.create({
      locked: false,
      arcpId: data.arcpId,
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
      { model: models.record, where: { id: recordId }, attributes: [ "id" ], raw: true },
    ];
  }
  return await models.record.findOne(clause);
}

async function decodeHash({ id }) {

  // With ARCPID like
  // arcp://name,
  // hash it and then find it by it.
}

async function getRawCrate({ diskPath, catalogFilename }) {
  const ocflObject = new OcflObject(diskPath);
  const json = await readCrate(ocflObject, catalogFilename);
  return json;
}

async function getUridCrate({ host, arcpId, diskPath, catalogFilename, typesTransform }) {
  const ocflObject = new OcflObject(diskPath);
  const newCrate = await transformURIs({
    host,
    recordId: arcpId,
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
