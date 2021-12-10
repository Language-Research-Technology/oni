const models = require("../models");
const { getLogger } = require("../services");
const { isEmpty } = require('lodash');

const log = getLogger();

async function getRootMemberOfs({ crateId }) {
  if (isEmpty(crateId) || crateId == "null" || crateId == "undefined") {
    crateId = null;
  }
  const memberOfs = await models.rootMemberOf.findAll({
    where: {
      memberOf: crateId
    },
    include: [
      { model: models.record, attributes: [ 'id', 'name', 'license', 'description' ] }
    ]
  });
  return {
    total: memberOfs.length || 0,
    data: memberOfs
  }
}

module.exports = {
  getRootMemberOfs
}
