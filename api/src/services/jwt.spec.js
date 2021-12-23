require("regenerator-runtime/runtime");
const { generateToken, verifyToken } = require("./jwt");
const { loadConfiguration } = require("../services");
const chance = require("chance").Chance();
const MockDate = require("mockdate");
const { copy, move, readJSON, writeJSON } = require("fs-extra");
const { setupBeforeAll, setupBeforeEach, teardownAfterAll, teardownAfterEach } = require("../services");

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

        const configPath = process.env.ONI_CONFIG_PATH || "/srv/configuration/development-configuration.json";
        const configPathCopy = `${process.env.ONI_CONFIG_PATH}.copy` || "/srv/configuration/development-configuration-copy.json"
        await copy(
          configPath,
          configPathCopy
        );
        let config = await readJSON(configPath);
        config.api.session.secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
        await writeJSON(configPath, config);
        configuration = await loadConfiguration();
        try {
            let data = await verifyToken({ token, configuration });
        } catch (error) {
            expect(error.message).toBe("signature verification failed");
        }

        move(
          configPathCopy,
          configPath,
            { overwrite: true }
        );
        await user.destroy();
    });
});
