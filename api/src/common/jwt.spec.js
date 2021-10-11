require("regenerator-runtime");
import { createUser } from "../lib/user";
import { generateToken, verifyToken } from "./jwt";
import { loadConfiguration } from "../common";
const chance = require("chance").Chance();
import MockDate from "mockdate";
import { copy, move, readJSON, writeJSON } from "fs-extra";
import { setupBeforeAll, setupBeforeEach, teardownAfterAll, teardownAfterEach } from "./";

describe("JWT tests", () => {
    let users, configuration;
    const userEmail = chance.email();
    const adminEmail = chance.email();
    beforeAll(async () => {
        configuration = await setupBeforeAll({ adminEmails: [adminEmail] });
    });
    beforeEach(async () => {
        users = await setupBeforeEach({ emails: [userEmail] });
    });
    afterEach(async () => {
        await teardownAfterEach({ users });
    });
    afterAll(async () => {
        await teardownAfterAll(configuration);
    });
    it("should be able to create a jwt", async () => {
        let user = users[0];
        let configuration = await loadConfiguration();
        let { token, expires } = await generateToken({ configuration, user });
        expect(token).toBeDefined;
        expect(expires).toBeDefined;

        await user.destroy();
    });
    it("should be able to verify a jwt", async () => {
        let user = users[0];
        let configuration = await loadConfiguration();
        let { token, expires } = await generateToken({ configuration, user });

        let data = await verifyToken({ token, configuration });
        expect(data.email).toEqual(user.email);

        await user.destroy();
    });
    it("should throw because the jwt is expired", async () => {
        let user = users[0];
        let configuration = await loadConfiguration();

        MockDate.set("2000-11-22");
        let { token, expires } = await generateToken({ configuration, user });
        MockDate.reset();

        try {
            let data = await verifyToken({ token, configuration });
        } catch (error) {
            expect(error.message).toBe("token expired");
        }

        await user.destroy();
    });
    it("should throw because the jwt is unverified", async () => {
        let user = users[0];
        let configuration = await loadConfiguration();
        let { token, expires } = await generateToken({ configuration, user });

        await copy(
            "/srv/configuration/development-configuration.json",
            "/srv/configuration/development-configuration-copy.json"
        );
        let config = await readJSON("/srv/configuration/development-configuration.json");
        config.api.session.secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
        await writeJSON("/srv/configuration/development-configuration.json", config);
        configuration = await loadConfiguration();
        try {
            let data = await verifyToken({ token, configuration });
        } catch (error) {
            expect(error.message).toBe("signature verification failed");
        }

        move(
            "/srv/configuration/development-configuration-copy.json",
            "/srv/configuration/development-configuration.json",
            { overwrite: true }
        );
        await user.destroy();
    });
});
