import models from "../models";
import { loadConfiguration } from '../services';
import { uniqBy } from 'lodash';

export async function createUserMemberships({ memberships, userId }) {

  const destroyMemberships = await models.userMembership.destroy({ where: { userId: userId } });

  for (const membership of memberships) {
    const createMemberships = await models.userMembership.findOrCreate({
      where: { userId: userId, group: membership['group'] },
      defaults: { userId: userId, group: membership['group'] }
    });
  }
}

export async function getUserMemberships({ where }) {
  let userMembership = await models.userMembership.findAll({
    where,
  });
  return userMembership;
}
