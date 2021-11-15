const models = require("../models");
const { getLogger } = require("../common");

const log = getLogger();

async function getRootMemberOfs({ crateId }) {

    const memberOfs = await models.rootMemberOf.findAll({
      where: {
        memberOf: crateId
      },
      include: [
        { model: models.record, attributes: [ 'id', 'name', 'license', 'diskPath', 'description' ] }
      ]
    });
    return {
      total: memberOfs.length || 0,
      data: memberOfs
    }
}

module.exports = {
  getRootMemberOfs: getRootMemberOfs
}
