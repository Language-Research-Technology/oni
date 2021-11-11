const models = require("../models");
const { getLogger } = require("../common");
const { isUndefined, flatten } = require('lodash');

const log = getLogger();

async function getRootConformsTos({ conforms, members }) {

  try {
    if (members == 'false' || isUndefined(members) || members === '') {
      const conformsTo = await models.rootConformsTo.findAll({
        where: {
          conformsTo: conforms
        },
        attributes: { exclude: [ 'id', 'recordId'] },
        include: [ {
          model: models.record,
          attributes: [ 'name', 'license', 'description' ]
        } ]
      });
      return conformsTo;
    } else {
      const results = await models.sequelize.query(`
        SELECT c."conformsTo",
               m."crateId",
               m."memberOf",
               r."license"     as "record.license",
               r."name"        as "record.name",
               r."description" as "record.description"
        FROM public."records" as r,
             public."rootMemberOfs" as m,
             public."rootConformsTos" as c
        WHERE c."conformsTo" = :conforms
          AND m."memberOf" = :members
          AND c."recordId" = r."id"
          AND m."recordId" = r."id"
        --'https://github.com/Language-Research-Technology/ro-crate-profile#Collection'
        --ORDER BY m."crateId" ASC LIMIT 100 
      `, {
        replacements: { members: members, conforms: conforms },
        type: models.Sequelize.QueryTypes.SELECT,
        nest: true // This in order to return a similar result as when members is false. And cheaper
      });
      return results;
    }
  } catch (e) {
    log.error(e);
    return {
      data: null,
      error: e.message
    }
  }
}

module.exports = {
  getRootConformsTos: getRootConformsTos
}
