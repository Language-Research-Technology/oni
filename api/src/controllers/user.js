import models from "../models";
import {getLogger, logEvent} from '../services';
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
  if (!data.providerId) {
    throw new Error(`providerId is a required property`);
  }
  data.providerId = data.providerId.toString();
  if (!data.providerUsername) {
    throw new Error(`providerUsername is a required property`);
  }
  data.providerUsername = data.providerUsername.toString();

  if (!data.accessToken) {
    throw new Error(`accessToken is required for getting users memberships`);
  }
  data.accessToken = data.accessToken.toString();

  let user = await models.user.findOne({
    where: {provider: data.provider, providerId: data.providerId}
  });
  if (!user) {
    // no user account found but email in admin list
    data.locked = false;
    data.upload = true;
    data.administrator = true;

    if (!data.accessToken) {
      await logEvent({
        level: "error",
        owner: first(configuration.api.administrators),
        text: "No access token provided for user",
      });
    } else {
      data.accessToken = utils.encrypt(tokenConf.secret, data.accessToken);
      data.accessTokenExpiresAt = data?.accessTokenExpiresAt;
    }
    if (data.refreshToken) {
      data.refreshToken = utils.encrypt(tokenConf.secret, data?.refreshToken);
    }
    try {
      user = await models.user.findOrCreate({
        where: {provider: data.provider, providerId: data.providerId},
        defaults: data,
      });
      user = first(user);
    } catch (e) {
      const message = `Could not find or create user table with providerId: ${data.providerId} : ${e.message}`
      log.error(message);
      throw new Error(message);
    }
  } else if (user && !configuration.api.administrators.includes(data?.email)) {
    // user account found and not admin
    log.debug(`User Id : ${user['id']}`);

    user.locked = false;
    user.upload = false;
    user.administrator = false;
    user.provider = data.provider;
    user.providerId = data.providerId;
    user.name = data?.name;
    user.providerUsername = data.providerUsername;
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
