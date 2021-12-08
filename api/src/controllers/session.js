const { models } = require("../models");
const { loadConfiguration, generateToken } = require("../services");

async function getSession({ userId, sessionId }) {
  let where = {};
  if (userId) where.userId = userId;
  if (sessionId) where.id = sessionId;
  let session = await models.session.findOne({
    where,
  });
  return session;
}

async function createSession({ user }) {
  let configuration = await loadConfiguration();
  if (!user) {
    throw new Error(`A user object is required`);
  }

  // destroy any existing sessions - only one ever
  let sessions = await models.session.findAll({ where: { userId: user.id } });
  if (sessions.length) {
    for (let session of sessions) {
      await session.destroy();
    }
  }

  let { token, expires } = await generateToken({ configuration, user });

  let session = await models.session.create({ token, userId: user.id, expires });
  return session;
}

async function destroySession({ sessionId }) {
  let session = await models.session.findOne({ where: { id: sessionId } });
  await session.destroy();
}

module.exports = {
  getSession,
  createSession,
  destroySession
}
