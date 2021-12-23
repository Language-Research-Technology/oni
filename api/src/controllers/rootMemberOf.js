import models from "../models";
import { getLogger } from "../services";
import { isEmpty } from 'lodash';

const log = getLogger();

export async function getRootMemberOfs({ crateId }) {
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

