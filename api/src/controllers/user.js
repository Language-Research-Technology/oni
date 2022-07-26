import models from "../models";
import {getLogger} from '../services/logger';
import {uniqBy, first} from 'lodash';
import * as utils from '../services/utils';

const log = getLogger();

export async function getUsers({offset = 0, limit = 10}) {
  let users = await models.user.findAndCountAll({
    offset,
    limit,
    order: [
      ["givenName", "ASC"],
      ["familyName", "ASC"],
    ],
  });
  return {total: users.count, users: users.rows.map((u) => u.get())};
}

export async function getUser({where}) {
  //Usage: getUser({ where: { column: value })
  let user = await models.user.findOne({
    where,
  });
  return user;
}

export async function createUser({data, configuration}) {
  const tokenConf = configuration.api.tokens;
  if (!data.provider) {
    throw new Error(`Provider is a required property`);
  }
  let user = await models.user.findOne({
    where: {provider: data.provider, providerId: data.providerId.toString()}
  });
  if (!user) {
    // no user account found but email in admin list
    data.locked = false;
    data.upload = true;
    data.administrator = true;

    // This is required because we use findOrCreate
    if (data.accessToken) {
      data.accessToken = utils.encrypt(tokenConf.secret, data?.accessToken);
    }
    if (data.refreshToken) {
      data.refreshToken = utils.encrypt(tokenConf.secret, data?.refreshToken);
    }
    user = await models.user.findOrCreate({
      where: {providerId: data.providerId.toString()},
      defaults: data,
    });
    user = first(user);

  } else if (user && !configuration.api.administrators.includes(data?.email)) {
    // user account found and not admin

    log.debug(`User Id : ${user['id']}`);

    user.locked = false;
    user.upload = false;
    user.administrator = false;
    user.provider = data.provider;
    user.name = data?.name;
    user.providerId = data.id;
    user.providerUsername = data?.providerUsername;
    if (data.accessToken) {
      user.accessToken = utils.encrypt(tokenConf.secret, data?.accessToken);
      user.accessTokenExpiresAt = data?.accessTokenExpiresAt;
    }
    if (data.refreshToken) {
      user.refreshToken = utils.encrypt(tokenConf.secret, data?.refreshToken);
    }
    user.email = data?.email;

    await user.save();
  }
  return user;
}

export async function updateUser({where, key, value, multi}) {
  let user = await models.user.findOne(where);
  if (multi) {
    multi.forEach((m) => {
      user[m.key] = m.value;
    });
  } else {
    user[key] = value;
  }
  log.debug(`Updating user ${user.id}`)
  await user.save();
  return user;
}

export async function deleteUser({userId}) {
  let user = await models.user.findOne({where: {id: userId}});
  await user.destroy();
}

export async function toggleUserCapability({userId, capability}) {
  let user = await models.user.findOne({where: {id: userId}});
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

export async function createAllowedUserStubAccounts({emails}) {
  let users = emails.map((email) => {
    return {
      email,
      provider: "unset",
      locked: false,
      upload: false,
      administrator: false,
    };
  });
  users = await models.user.bulkCreate(users, {ignoreDuplicates: true});

  return uniqBy(users, "email");
}
