import { SignJWT, jwtVerify } from "jose";
import { createSecretKey } from "crypto";
import add from "date-fns/add";
import isAfter from "date-fns/isAfter";
import parseISO from "date-fns/parseISO";
import { getUser } from './user';
import { UnauthorizedError } from 'restify-errors';

async function generateToken({ configuration, user }) {
  const key = createSecretKey(Buffer.from(configuration.api.session.secret, "utf-8"));
  const expires = add(new Date(), configuration.api.session.lifetime);
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    givenName: user.givenName,
    familyName: user.familyName,
    administrator: user.administrator,
    upload: user.upload,
    expires,
  })
    .setProtectedHeader({ alg: "HS256" })
    .sign(key);

  return { token, expires };
}

async function verifyToken({ token, configuration }) {
  //try bearer token
  console.log(token)
  const user = await getUser({ where: { apiToken: token } });
  console.log(`trying bearer: ${user?.id}`)
  if (user?.id) {
    return user;
  } else {
    //try JWT token
    const key = createSecretKey(Buffer.from(configuration.api.session.secret, "utf-8"));
    let { payload } = await jwtVerify(token, key, {});
    console.log(`trying JWT: ${payload?.id}`)
    if (isAfter(new Date(), parseISO(payload.expires))) {
      // token expired
      throw new Error(`token expired`);
    }
    return payload;
  }
}

module.exports = {
  generateToken,
  verifyToken
}
