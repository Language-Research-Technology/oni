import { Record, RootType } from "../models/index.js";
import { getLogger } from "../services/logger.js";

const log = getLogger();

export async function getRootTypes({ crateId }) {
  const record = await Record.findOne({ where: { crateId: crateId } });
  if (record) {
    const recordRootTypes = await RootType.findAll({
      where: {
        recordId: record.dataValues.id
      },
      include: [
        { model: Record, attributes: [ 'crateId' ] }
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
