import { Record, RecordCrateMember } from "../models/index.js";
import { getLogger } from "../services/logger.js";

//const log = getLogger();

export async function getRecordMembers({ recordId }) {

  const record = await Record.findOne({ where: { crateId: recordId } });
  if (record) {
    const recordCrateMembers = RecordCrateMember.findAll({
      where: {
        recordId: record.dataValues.id
      }
    });
    return recordCrateMembers;
  }
}
