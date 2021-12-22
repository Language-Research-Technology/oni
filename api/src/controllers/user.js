const models = require('../models');
const { getLogger } = require('../services/logger');
const { uniqBy, first } = require('lodash');
const log = getLogger();

async function getUsers({ offset = 0, limit = 10 }) {
  let users = await models.user.findAndCountAll({
    offset,
    limit,
    order: [
      [ "givenName", "ASC" ],
      [ "familyName", "ASC" ],
    ],
  });
  return { total: users.count, users: users.rows.map((u) => u.get()) };
}

async function getUser({ where }) {
  //Usage: getUser({ where: { column: value })
  let user = await models.user.findOne({
    where,
  });
  return user?.dataValues;
}

async function createUser({ data, configuration }) {
  if (!data.provider) {
    throw new Error(`Provider is a required property`);
  }
  let user = await models.user.findOne({
    where: { provider: data.provider, providerId: data.providerId.toString() }
  });
  if (!user) {
    // no user account found but email in admin list
    data.locked = false;
    data.upload = true;
    data.administrator = true;

    user = await models.user.findOrCreate({
      where: { providerId: data.providerId.toString() },
      defaults: data,
    });
    user = first(user);

  } else if (user && !configuration.api.administrators.includes(data?.email)) {
    // user account found and not admin

    log.debug(`User Id : ${ user['id'] }`);

    user.locked = false;
    user.upload = false;
    user.administrator = false;
    user.provider = data.provider;
    user.name = data?.name;
    user.providerId = data.id;
    user.providerUsername = data?.providerUsername;
    user.accessToken = data.accessToken;
    user.email = data?.email;

    await user.save();
  }
  return user;
}

async function updateUser({ where, key, value }) {
  let user = await models.user.findOne(where);
  user[key] = value;
  await user.save();
  return user;
}

async function deleteUser({ userId }) {
  let user = await models.user.findOne({ where: { id: userId } });
  await user.destroy();
}

async function toggleUserCapability({ userId, capability }) {
  let user = await models.user.findOne({ where: { id: userId } });
  switch (capability) {
    case "lock":
      user.locked = !user.locked;
      break;
    case "admin":
      user.administrator = !user.administrator;
      break;
    case "upload":
      user.upload = !user.upload;
      break;
  }
  user = await user.save();
  return user;
}

async function createAllowedUserStubAccounts({ emails }) {
  let users = emails.map((email) => {
    return {
      email,
      provider: "unset",
      locked: false,
      upload: false,
      administrator: false,
    };
  });
  users = await models.user.bulkCreate(users, { ignoreDuplicates: true });

  return uniqBy(users, "email");
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  deleteUser,
  updateUser,
  createAllowedUserStubAccounts
}
