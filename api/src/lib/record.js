import models from "../models";
import {loadConfiguration} from "../common";
import {uniqBy} from "lodash";

export async function getRecords({ offset = 0, limit = 10 }) {
    let records = await models.record.findAndCountAll({
        offset,
        limit,
        order: [

        ],
    });
    return { total: records.count, data: records.rows.map((r) => r.get()) };
}

export async function getRecord({recordId}) {
    let where = {};
    if (recordId) where.arcpId = recordId;
    let record = await models.records.findOne({
        where,
    });
    return record;
}

export async function createRecord(data) {
    const configuration = await loadConfiguration();
    if (!data.arcpId) {
        throw new Error(`Id is a required property`);
    }
    if (!data.path) {
        throw new Error(`Path is a required property`);
    }
    const rec = {}
    rec.locked = false;
    rec.administrator = false;
    rec.arcpId = data.arcpId;
    rec.path = data.path;
    rec.diskPath = data.diskPath;
    rec.license = data.license;
    rec.name = data.name;
    rec.description = data.description;

    let record = models.record.build(rec);

    await record.save();

    return record;
}
