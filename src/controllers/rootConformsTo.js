import { QueryTypes } from "sequelize";
import { Record, RootConformsTo, sequelize } from "../models/index.js";
import { getLogger } from "../services/logger.js";
import { isUndefined } from "lodash-es";

const log = getLogger();

export async function getRootConformsToByCrateId({ crateId }) {
  const conformsTo = await RootConformsTo.findAll({
    where: {
      crateId: crateId
    },
    attributes: { exclude: ['id'] },
    include: [{
      model: Record,
      attributes: ['name', 'license', 'description']
    }]
  });
  return conformsTo;
}

export async function getAllRootConformsTos({ offset = 0, limit = 10 }) {
  const conformsTo = await RootConformsTo.findAll({
    offset,
    limit,
    attributes: { exclude: ['id', 'recordId'] },
    include: [{
      model: Record,
      attributes: ['name', 'license', 'description']
    }]
  });
  return conformsTo;
}

export async function getRootConformsTos({ conforms, members, crateId }) {

  try {
    let queryMembers = false;
    if (members === null || members == 'false' || members === '') {
      members = null;
      queryMembers = false;
    } else {
      queryMembers = isUndefined(members);
    }
    log.debug(`Getting root conformsTo of ${conforms}`);
    log.debug(`With members === ${members}`);
    // if members is undefined use this
    if (queryMembers) {
      const where = {
        conformsTo: conforms
      }
      if (crateId) {
        log.debug(`Get crateId: ${crateId}`);
        where.crateId = crateId;
      }
      const conformsTo = await RootConformsTo.findAll({
        where: where,
        attributes: { exclude: ['id', 'recordId'] },
        include: [{
          model: Record,
          attributes: ['name', 'license', 'description']
        }]
      });
      return conformsTo;
    } else {
      if (members === null) {
        const results = await sequelize.query(`
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
          AND m."memberOf" IS null
          AND c."recordId" = r."id"
          AND m."recordId" = r."id"
        --ORDER BY m."crateId" ASC LIMIT 100 
        `, {
          replacements: { conforms: conforms },
          type: QueryTypes.SELECT,
          nest: true // This in order to return a similar result as when members is false. And cheaper
        });
        return results;
      } else {
        const results = await sequelize.query(`
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
          type: QueryTypes.SELECT,
          nest: true // This in order to return a similar result as when members is false. And cheaper
        });
        return results;
      }
    }
  } catch (e) {
    log.error(e);
    return {
      data: null,
      error: e.message
    }
  }
}
