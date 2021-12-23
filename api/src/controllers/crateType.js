import { castArray } from "lodash";
import models from "../models";
import { getLogger } from "../services";

const log = getLogger();

export async function getRecordTypes({ recordId, types }) {
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
