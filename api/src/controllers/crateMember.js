import models from "../models";
import { getLogger } from "../services";

const log = getLogger();

async function getRecordMembers({ recordId }) {

  const record = await models.record.findOne({ where: { crateId: recordId } });
  if (record) {
    const recordCrateMembers = models.recordCrateMember.findAll({
      where: {
        recordId: record.dataValues.id
      }
    });
    return recordCrateMembers;
  }
}

module.exports = {
  getRecordMembers
}
