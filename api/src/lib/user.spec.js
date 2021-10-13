require("regenerator-runtime");
import {
    getUsers,
    getUser,
    createUser,
    deleteUser,
    toggleUserCapability,
    createAllowedUserStubAccounts,
} from "./user";

const chance = require("chance").Chance();
import {setupBeforeAll, setupBeforeEach, teardownAfterAll, teardownAfterEach} from "../common";

describe("User management tests", () => {
    let users, configuration;
    const userEmail = chance.email();
    const adminEmail = chance.email();
    beforeAll(async () => {
        configuration = await setupBeforeAll({adminEmails: [adminEmail]});
    });
    beforeEach(async () => {
        users = await setupBeforeEach({emails: [userEmail]});
    });
    afterEach(async () => {
        await teardownAfterEach({users});
    });
    afterAll(async () => {
        await teardownAfterAll(configuration);
    });
    it("should be able to get a list of users", async () => {
        let userDef = users[0];
        // expect to find two users
        let accounts = await getUsers({});
        expect(accounts.users.length).toEqual(1);
        expect(accounts.users[0].email).toEqual(userDef.email);

        // expect to find no users
        accounts = await getUsers({offset: 10});
        expect(accounts.users.length).toEqual(0);

        // // expect to find no users
        accounts = await getUsers({age: 0, limit: 0});
        expect(accounts.users.length).toEqual(0);
    });
    it("should be able to get a specified user", async () => {
        let userDef = users[0];
        let user = await getUser({userId: userDef.id});
        expect(user.email).toEqual(userDef.email);

        user = await getUser({email: userDef.email});
        expect(user.email).toEqual(userDef.email);
        await user.destroy();

        user = await getUser({email: chance.word()});
        expect(user).toBeNull;
    });
    it("should be able to set up a normal user account", async () => {
        //  create stubb account
        let email = chance.email();
        let users = await createAllowedUserStubAccounts({emails: [email]});

        //  create user
        let user = await createUser({
            email,
            provider: "unset",
            locked: false,
            upload: false,
            admin: false,
        });
        expect(user.email).toEqual(users[0].email);
        await user.destroy();
    });
    it("should be able to set up an admin user account", async () => {
        //  create admin user account
        let user = await createUser({
            email: adminEmail,
            provider: "unset",
            locked: false,
            upload: false,
        });
        expect(user.email).toEqual(adminEmail);
        await user.destroy();
    });
    it("should be able to lock a user", async () => {
        let userDef = users[0];
        let user = await getUser({userId: userDef.id});
        user = await toggleUserCapability({
            userId: user.id,
            capability: "lock",
        });
        expect(user.locked).toEqual(true);

        user = await toggleUserCapability({
            userId: user.id,
            capability: "lock",
        });
        expect(user.locked).toEqual(false);
        await user.destroy();
    });
    it("should be able to toggle a user as an admin", async () => {
        let userDef = users[0];
        let user = await getUser({userId: userDef.id});
        user = await toggleUserCapability({
            userId: user.id,
            capability: "upload",
        });
        expect(user.upload).toEqual(true);

        user = await toggleUserCapability({
            userId: user.id,
            capability: "upload",
        });
        expect(user.upload).toEqual(false);
        await user.destroy();
    });
    it("should be able to toggle user upload privileges", async () => {
        let userDef = users[0];
        let user = await getUser({userId: userDef.id});
        user = await toggleUserCapability({
            userId: user.id,
            capability: "admin",
        });
        expect(user.administrator).toEqual(true);

        user = await toggleUserCapability({
            userId: user.id,
            capability: "admin",
        });
        expect(user.administrator).toEqual(false);
        await user.destroy();
    });
    it("should be able to create user stub accounts", async () => {
        let emails = [chance.email()];
        let users = await createAllowedUserStubAccounts({emails});
        expect(users.length).toEqual(1);
        expect(emails).toEqual([users[0].email]);
        for (let user of users) await user.destroy();

        let email = chance.email();
        emails = [email, email];
        users = await createAllowedUserStubAccounts({emails});
        expect(users.length).toEqual(1);
        for (let user of users) await user.destroy();
    });
});
