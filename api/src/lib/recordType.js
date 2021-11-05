const { castArray } = require('lodash');
const models = require("../models");
const { getLogger } = require("../common");
const { getItem, readCrate } = require("../common/ocfl-tools");
const { OcflObject } = require("ocfl");
const { transformURIs } = require("../common/ro-crate-utils");

const log = getLogger();

async function getRecordTypes({ recordId, types }) {
  types = types.split(',');
  types = castArray((types));
  const record = await models.record.findOne({ where: { arcpId: recordId } });
  if (record) {
    const recordTypes = await models.recordType.findAll({
      where: {
        recordId: record.dataValues.id,
        recordType: { [models.Sequelize.Op.in]: types }
      },
      attributes: [ 'recordType', 'crateId' ],
      include: [
        { model: models.record, attributes: [ 'arcpId' ] }
      ]
    });
    return recordTypes;
  } else {
    return undefined;
  }

}

module.exports = {
  getRecordTypes: getRecordTypes
}
