import models from "../models";
import {loadConfiguration} from "../common";
import {uniqBy} from "lodash";
import {getLogger} from "../common/logger";
import {getItem, readCrate} from "../common/ocfl-tools";
import {OcflObject} from "ocfl";
import {ROCrate} from 'ro-crate';
import {transformURIs} from "../common/ro-crate-utils";
import path from "path";

const log = getLogger();

export async function deleteRecords() {
  // Ay nanita
  let records = await models.record.destroy({
    where: {}
  });
  return records;
}

export async function getRecords({offset = 0, limit = 10}) {
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

export async function getRecord({recordId}) {
  let where = {};
  if (recordId) where.arcpId = recordId;
  log.debug(recordId);
  let record = await models.record.findOne({
    where,
  });
  if (record) {
    return record;
  }
  return {recordId: recordId, message: 'Not Found'}
}

export async function createRecord(data) {
  try {
    log.debug(data.arcpId)
    if (!data.arcpId) {
      throw new Error(`Id is a required property`);
    }
    if (!data.path) {
      throw new Error(`Path is a required property`);
    }
    const rec = {}
    rec.locked = false;
    rec.arcpId = data.arcpId;
    rec.path = data.path;
    rec.diskPath = data.diskPath;
    rec.license = data.license;
    rec.name = data.name;
    rec.description = data.description;

    let record = models.record.build(rec);

    await record.save();
    return record;
  } catch (e) {
    log.error('Creating Records');
    log.error(e);
  }
}

export async function findRecordByIdentifier({identifier, recordId}) {
  let clause = {
    where: {identifier},
  };
  if (recordId) {
    clause.include = [
      {model: models.record, where: {id: recordId}, attributes: ["id"], raw: true},
    ];
  }
  return await models.record.findOne(clause);
}

export async function decodeHash({id}) {

  // With ARCPID like
  // arcp://name,
  // hash it and then find it by it.
}

export async function getRawCrate({diskPath, catalogFilename}) {
  const ocflObject = new OcflObject(diskPath);
  const json = await readCrate(ocflObject, catalogFilename);
  return json;
}

export async function getUridCrate({host, arcpId, diskPath, catalogFilename, typesTransform}) {
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

export async function getFile({record, itemId, catalogFilename}) {
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
