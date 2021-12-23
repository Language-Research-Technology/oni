import models from "../models";
import { loadConfiguration } from '../services';
import { uniqBy } from 'lodash';

export async function createUserMemberships({ memberships, user }) {

  const destroyMemberships = await models.userMembership.destroy({ where: { userId: user['id'] } });

  for (const membership of memberships) {
    const createMemberships = await models.userMembership.findOrCreate({
      where: { userId: user['id'], group: membership['group'] },
      defaults: { userId: user['id'], group: membership['group'] }
    });
  }
}

export async function getUserMemberships({ where }) {
  let userMembership = await models.userMembership.findAll({
    where,
  });
  return userMembership;
}
