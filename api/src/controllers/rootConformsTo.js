import models from "../models";
import { getLogger } from "../services";
import { isUndefined } from 'lodash';

const log = getLogger();

export async function getRootConformsToByCrateId({crateId}){
  const conformsTo = await models.rootConformsTo.findAll({
    where: {
      crateId: crateId
    },
    attributes: { exclude: [ 'id'] },
    include: [ {
      model: models.record,
      attributes: [ 'name', 'license', 'description' ]
    } ]
  });
  return conformsTo;
}

export async function getAllRootConformsTos({ offset = 0, limit = 10 }) {
  const conformsTo = await models.rootConformsTo.findAll({
    offset,
    limit,
    attributes: { exclude: [ 'id', 'recordId'] },
    include: [ {
      model: models.record,
      attributes: [ 'name', 'license', 'description' ]
    } ]
  });
  return conformsTo;
}

export async function getRootConformsTos({ conforms, members }) {

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
