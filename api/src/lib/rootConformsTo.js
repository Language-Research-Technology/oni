const models = require("../models");
const { getLogger } = require("../common");

const log = getLogger();

async function getRootConformsTos({ recordId }) {
  const record = await models.record.findOne({ where: { arcpId: recordId } });
  if (record) {
    const conformsTo = await models.rootConformsTo.findAll({
      where: {
        recordId: record.dataValues.id
      },
      include: [
        { model: models.record, attributes: [ 'id', 'arcpId', 'name', 'license', 'description' ] }
      ]
    });
    return {
      total: conformsTo.length || 0,
      data: conformsTo
    }
  } else {
    return {
      total: 0,
      data: []
    }
  }
}

module.exports = {
  getRootConformsTos: getRootConformsTos
}
