import { castArray } from "lodash-es";
import { Record, RecordCrateType } from "../models/index.js";
import { Op } from "sequelize";
//import { getLogger } from "../services/logger.js";

//const log = getLogger();

export async function getRecordTypes({ recordId, types }) {
  types = types.split(',');
  types = castArray((types));
  const record = await Record.findOne({ where: { crateId: recordId } });
  if (record) {
    const recordCrateTypes = await RecordCrateType.findAll({
      where: {
        recordId: record.dataValues.id,
        recordType: { [Op.in]: types }
      },
      attributes: [ 'recordType', 'crateId' ],
      include: [
        { model: Record, attributes: [ 'id' ] }
      ]
    });
    return recordCrateTypes;
  } else {
    return undefined;
  }

}
