const { SignJWT } = require("jose/jwt/sign");
const { jwtVerify } = require("jose/jwt/verify");
const { createSecretKey } = require("crypto");
const { add, isAfter, parseISO } = require("date-fns");

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
  const key = createSecretKey(Buffer.from(configuration.api.session.secret, "utf-8"));
  let { payload } = await jwtVerify(token, key, {});

  if (isAfter(new Date(), parseISO(payload.expires))) {
    // token expired
    throw new Error(`token expired`);
  }
  return payload;
}

module.exports = {
  generateToken,
  verifyToken
}
