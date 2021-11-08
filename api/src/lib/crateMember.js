const models = require("../models");
const { getLogger } = require("../common");

const log = getLogger();

async function getRecordMembers({ recordId }) {

  const record = await models.record.findOne({ where: { arcpId: recordId } });
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
  getRecordMembers: getRecordMembers
}
