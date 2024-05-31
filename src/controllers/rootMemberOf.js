import { Record, RootMemberOf } from "../models/index.js";
import { getLogger } from "../services/logger.js";
import { isEmpty } from "lodash-es";

const log = getLogger();

export async function getRootMemberOfs({ crateId }) {
  if (isEmpty(crateId) || crateId == "null" || crateId == "undefined") {
    crateId = null;
  }
  const memberOfs = await RootMemberOf.findAll({
    where: {
      memberOf: crateId
    },
    include: [
      { model: Record, attributes: [ 'id', 'name', 'license', 'description' ] }
    ]
  });
  return {
    total: memberOfs.length || 0,
    data: memberOfs
  }
}

