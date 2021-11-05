const models = require("../models");
const { getLogger } = require("../common");
const { getItem, readCrate } = require("../common/ocfl-tools");
const { OcflObject } = require("ocfl");
const { transformURIs } = require("../common/ro-crate-utils");
const { castArray } = require('lodash');

const log = getLogger();

async function getRecordMembers({ recordId }) {

  const record = await models.record.findOne({ where: { arcpId: recordId } });
  if (record) {
    const recordMembers = models.recordMember.findAll({
      where: {
        recordId: record.dataValues.id
      }
    });
    return recordMembers;
  }
}

module.exports = {
  getRecordMembers: getRecordMembers
}
