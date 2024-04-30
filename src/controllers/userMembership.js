import { UserMembership } from "../models/userMembership.js";

export async function createUserMemberships({ memberships, userId }) {

  const destroyMemberships = await UserMembership.destroy({ where: { userId: userId } });

  for (const membership of memberships) {
    const createMemberships = await UserMembership.findOrCreate({
      where: { userId: userId, group: membership['group'] },
      defaults: { userId: userId, group: membership['group'] }
    });
  }
}

export async function getUserMemberships({ where }) {
  let userMembership = await UserMembership.findAll({
    where,
  });
  return userMembership;
}
