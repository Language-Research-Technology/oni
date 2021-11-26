const models = require('../models');
const { loadConfiguration } = require('../services');
const { uniqBy } = require('lodash');

async function createUserMemberships({ memberships, user }) {

  const destroyMemberships = await models.userMembership.destroy({ where: { userId: user['id'] } });

  for (const membership of memberships) {
    const createMemberships = await models.userMembership.findOrCreate({
      where: { userId: user['id'], group: membership['group'] },
      defaults: { userId: user['id'], group: membership['group'] }
    });
  }
}

async function getUserMemberships({ where }) {
  let userMembership = await models.userMembership.findAll({
    where,
  });
  return userMembership;
}

module.exports = {
  createUserMemberships,
  getUserMemberships
}
