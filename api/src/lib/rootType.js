const { castArray } = require('lodash');
const models = require("../models");
const { getLogger } = require("../common");

const log = getLogger();

async function getRootTypes({ recordId, types }) {
  types = types.split(',');
  types = castArray((types));
  const record = await models.record.findOne({ where: { arcpId: recordId } });
  if (record) {
    const recordRootTypes = await models.rootType.findAll({
      where: {
        recordId: record.dataValues.id,
        recordType: { [models.Sequelize.Op.in]: types }
      },
      attributes: [ 'recordType', 'crateId' ],
      include: [
        { model: models.record, attributes: [ 'arcpId' ] }
      ]
    });
    return recordRootTypes;
  } else {
    return undefined;
  }

}

module.exports = {
  getRootTypes: getRootTypes
}
