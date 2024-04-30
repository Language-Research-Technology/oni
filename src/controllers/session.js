import { Session } from "../models/index.js";
import { add } from "date-fns";
import { sign } from 'hono/jwt';

export async function getSession({ userId, sessionId }) {
  let where = {};
  if (userId) where.userId = userId;
  if (sessionId) where.id = sessionId;
  let session = await Session.findOne({
    where,
  });
  return session;
}

export async function createSession({ user, configuration }) {
  if (!user) {
    throw new Error(`A user object is required`);
  }

  // destroy any existing sessions - only one ever
  let sessions = await Session.findAll({ where: { userId: user.id } });
  if (sessions.length) {
    for (let session of sessions) {
      await session.destroy();
    }
  }

  const expires = add(new Date(), configuration.api.session.lifetime);
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    givenName: user.givenName,
    familyName: user.familyName,
    administrator: user.administrator,
    upload: user.upload,
    expires,
  };
  const token = await sign(payload, configuration.api.session.secret)

  let session = await Session.create({ token, userId: user.id, expires });
  return session;
}

export async function destroySession({ sessionId }) {
  let session = await Session.findOne({ where: { id: sessionId } });
  await session.destroy();
}
