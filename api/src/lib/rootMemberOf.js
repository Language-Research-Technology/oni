const models = require("../models");
const { getLogger } = require("../common");

const log = getLogger();

async function getRootMemberOfs({ recordId }) {
  const memberOfs = await models.rootMemberOf.findAll({
    where: {
      memberOf: recordId
    },
    attributes: [ 'id', 'memberOf' ],
    include: [
      { model: models.record, attributes: [ 'id', 'arcpId', 'name', 'license', 'description' ] }
    ]
  });
  return {
    total: memberOfs.length || 0,
    records: memberOfs
  }
}

module.exports = {
  getRootMemberOfs: getRootMemberOfs
}
