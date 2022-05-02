import models from "../models";
import {getLogger} from "../services";
import {ocfltools} from "oni-ocfl";

import {transformURIs} from "../services/ro-crate-utils";
import {castArray} from 'lodash';
import * as fs from 'fs-extra';

const log = getLogger();

export async function deleteRecords() {
  // Ay nanita
  //This will delete all rocrate records and cascade. If you are re-structuring the database do docker-compose down -v
  try {
    await models.record.destroy({truncate: true, cascade: true});
    // Cascade to true. See index.js for association order. First do the hasMany then the belongsTo
  } catch (e) {
    log.error(e);
    throw new Error(e);
  }
}

export async function getRecords({offset = 0, limit = 10}) {
  let records = await models.record.findAndCountAll({
    offset,
    limit,
    order: [],
    attributes: {exclude: ['id']}
  });
  return {
    total: records.count,
    data: records.rows.map((r) => r.get())
  };
}

export async function getRecord({crateId}) {
  let where = {};
  if (crateId) where.crateId = crateId;
  log.silly(crateId);
  let record = await models.record.findOne({
    where,
    include: [{
      model: models.rootConformsTo
    }]
  });
  if (record) {
    return {data: record.get()}
  } else {
    return {data: null}
  }
}

export async function createRecord({data, memberOfs, atTypes, conformsTos}) {
  try {
    log.silly(data.crateId)
    if (!data.crateId) {
      return new Error(`Id is a required property`);
    }
    const r = await models.record.create({
      locked: false,
      crateId: data.crateId,
      license: data.license,
      name: data.name,
      description: data.description,
      pairtreeId: data.pairtreeId
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
    // If there is no memberOf it means its an oprhan?
    if (memberOfs.length < 1) {
      const member = await models.rootMemberOf.create({
        memberOf: null,
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

export async function createRecordWithCrate(data, hasMembers, atTypes) {
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

export async function findRecordByIdentifier({identifier, recordId}) {
  let clause = {
    where: {identifier},
  };
  if (recordId) {
    clause.include = [
      {model: models.record, where: {id: recordId}, attributes: ['id'], raw: true},
    ];
  }
  return await models.record.findOne(clause);
}

export async function decodeHash({id}) {

  // With ARCP like
  // arcp://name,
  // hash it and then find it by it.
}

export async function getRawCrate({repository, crateId, version}) {
  // TODO: return a specific version
  const fileInfo = await ocfltools.getFileInfo({repository, crateId, filePath: 'ro-crate-metadata.json'});
  const file = await fs.readFile(fileInfo.path, {encoding: 'utf-8'});
  log.debug('file opened')
  const json = JSON.parse(file);
  return json;
}

export async function getUridCrate({host, crateId, typesTransform, version, repository}) {
  // TODO: return a specific version
  log.silly('getUridCrate');
  const newCrate = await transformURIs({
    host,
    crateId: crateId,
    uridTypes: typesTransform,
    repository
  });
  return newCrate;
}


export async function getFile({itemId, repository, filePath}) {
  try {
    log.debug(`getFile in repository with id: ${itemId} found in: ${filePath}`);
    const fileInfo = await ocfltools.getFileInfo({repository, crateId: itemId, filePath});
    if (fileInfo && fileInfo.path) {
      const filePath = fileInfo.path;
      log.debug(filePath);
      const index = filePath.lastIndexOf("/");
      const fileName = filePath.substr(index);
      const ext = filePath.lastIndexOf(".");
      let extName;
      if (ext) {
        extName = filePath.substr(ext);
      }
      log.debug(`getFile: ${filePath}`);
      return {
        filename: fileName,
        filePath: filePath,
        mimetype: extName || 'file'
      }
    } else {
      log.error(`File in repository with id: ${itemId} not found in: ${filePath}`);
    }
  } catch (e) {
    log.error('getFile')
  }
}
