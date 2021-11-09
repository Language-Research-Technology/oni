const models = require("../models");
const { getLogger } = require("../common");

const log = getLogger();

async function getRootMemberOfs({ arcpId }) {

    const memberOfs = await models.rootMemberOf.findAll({
      where: {
        memberOf: arcpId
      },
      include: [
        { model: models.record, attributes: [ 'id', 'arcpId', 'name', 'license', 'description' ] }
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
