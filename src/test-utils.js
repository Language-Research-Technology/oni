import { sign } from "hono/jwt";
import { createUser } from "./controllers/user.js";
import { encrypt } from "./services/utils.js";
import { createUserMemberships } from "./controllers/userMembership.js";

export async function createJwtToken(secret, id, email = id) {
  const user = {
    id,
    email,
    expires: new Date(Date.now() + 600000),
  };
  return sign(user, secret);
}

export async function createUsers(configuration) {
  const tokenSecret = configuration.api.tokens.secret;
  const tokenPassword = configuration.api.tokens.accessTokenPassword;

  let john = await createUser({
    data: {
      email: 'john@test.com',
      name: 'John Doe',
      organization: 'TestOrg',
      provider: 'cilogon',
      providerId: 'http://cilogon.org/serverH/users/0',
      providerUsername: 'http://cilogon.org/serverH/users/0',
      locked: false,
      upload: false,
      administrator: false,
      accessToken: 'test_token',
      apiToken: encrypt(tokenSecret, 'john-api-token', tokenPassword)
    },
    configuration
  });
  await createUserMemberships({ memberships: [{ group: 'overseer' }, { group: 'tester' }], userId: john.id });
  return { john };
}

//configuration.api.administrators = ['admin@test.com'];
//   users = ['user@test.com'].map(async email => {
//     return await User.create({
//       email,
//       provider: "unset",
//       locked: false,
//       upload: false,
//       administrator: false,
//     });
//   });
// });
// after(async function () {
//   for (let user of users) {
//     await user.destroy();
//   }
//let user = users[0];
//let { token, expires } = await generateToken({ configuration, user });

