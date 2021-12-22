import models from "../models";
import { getLogger } from "../services";

const log = getLogger();

async function getRootTypes({ crateId }) {
  const record = await models.record.findOne({ where: { crateId: crateId } });
  if (record) {
    const recordRootTypes = await models.rootType.findAll({
      where: {
        recordId: record.dataValues.id
      },
      include: [
        { model: models.record, attributes: [ 'crateId' ] }
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
  getRootTypes
}
