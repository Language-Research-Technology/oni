import models from "../models";
import {loadConfiguration} from "../common";
import {uniqBy} from "lodash";
import {getLogger} from "../common/logger";
import {getItem, readCrate} from "../common/ocfl-tools";
import {OcflObject} from "ocfl";
import {ROCrate} from 'ro-crate';
import path from "path";

import {host} from "../common";

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

export async function getUridCrate({arcpId, diskPath, catalogFilename}) {
    const ocflObject = new OcflObject(diskPath);
    const json = await readCrate(ocflObject, catalogFilename);
    const crate = new ROCrate(json);
    crate.index();
    const uridTypes = ['File'];
    const updateItems = [];
    for (const item of crate.json_ld["@graph"]) {
        var types = crate.utils.asArray(item['@type']);
        // Look through types in order (for non-integer keys)
        for (let type of uridTypes) {
            if (types.includes(type)) {
                updateItems.push(item);
            }
        }
        const ref = crate.referenceToItem(item)
        if (item.hasOwnProperty('hasFile')) {

            ref.hasFile.forEach((i) => {
                i['@id'] = `${host}/data?arcpId=${arcpId}&file=${i['@id']}`;
            })
        }
        if (item.hasOwnProperty('thumbnail')) {
            const ref = crate.referenceToItem(item)
            ref.thumbnail['@id'] = `${host}/data?arcpId=${arcpId}&file=${ref.thumbnail['@id']}`;
        }
    }
    updateItems.forEach((i) => {
        //log.debug(i['@id']);
        const ref = crate.referenceToItem(i)
        ref['@id'] = `${host}/data?arcpId=${arcpId}&file=${ref['@id']}`;
    });
    return json;
}

export async function getFile({record, itemId, catalogFilename}) {

    const ocflObject = new OcflObject(record['diskPath']);
    const filePath = await getItem(ocflObject, catalogFilename,itemId);

    console.log(filePath);

    return {
        filename: 'name',
        filePath: filePath,
        mimetype: 'jpg'
    }
}
