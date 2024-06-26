import { SignJWT, jwtVerify } from "jose";
import { createSecretKey } from "crypto";
import { add, isAfter, parseISO } from "date-fns";
//import { getUser } from '../controllers/user';
import { encrypt } from "./utils.js";

export async function generateToken({ configuration, user }) {
  const key = createSecretKey(Buffer.from(configuration.api.session.secret, "utf-8"));
  const expires = add(new Date(), configuration.api.session.lifetime);
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
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

export async function verifyToken({ token, configuration }) {
  //try bearer token
  const tokenConf = configuration.api.tokens;
  //Using the same initVector when encrypted to be able to compare it.
  const tokenEncrypted = encrypt(tokenConf.secret, token, tokenConf.accessTokenPassword);
  const user = await getUser({ apiToken: tokenEncrypted });
  if (user?.id) {
    return user;
  } else {
    //try JWT token
    const key = createSecretKey(Buffer.from(configuration.api.session.secret, "utf-8"));
    let { payload } = await jwtVerify(token, key, {});
    if (isAfter(new Date(), parseISO(payload.expires))) {
      // token expired
      throw new Error(`token expired`);
    }
    return payload;
  }
}
