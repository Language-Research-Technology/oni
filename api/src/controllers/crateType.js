const { castArray } = require('lodash');
const models = require("../models");
const { getLogger } = require("../services");

const log = getLogger();

async function getRecordTypes({ recordId, types }) {
  types = types.split(',');
  types = castArray((types));
  const record = await models.record.findOne({ where: { crateId: recordId } });
  if (record) {
    const recordCrateTypes = await models.recordCrateType.findAll({
      where: {
        recordId: record.dataValues.id,
        recordType: { [models.Sequelize.Op.in]: types }
      },
      attributes: [ 'recordType', 'crateId' ],
      include: [
        { model: models.record, attributes: [ 'id' ] }
      ]
    });
    return recordCrateTypes;
  } else {
    return undefined;
  }

}

module.exports = {
  getRecordTypes
}
