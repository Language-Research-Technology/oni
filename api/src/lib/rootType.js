const { castArray } = require('lodash');
const models = require("../models");
const { getLogger } = require("../common");

const log = getLogger();

async function getRootTypes({ recordId }) {
  const record = await models.record.findOne({ where: { arcpId: recordId } });
  if (record) {
    const recordRootTypes = await models.rootType.findAll({
      where: {
        recordId: record.dataValues.id
      },
      include: [
        { model: models.record, attributes: [ 'arcpId' ] }
      ]
    });
    return {
      total: recordRootTypes.length || 0,
      data: recordRootTypes
    };
  } else {
     return {
      total: 0,
      data: []
    }
  }

}

module.exports = {
  getRootTypes: getRootTypes
}
