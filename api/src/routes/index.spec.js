import "regenerator-runtime";
import fetch from "node-fetch";
import { createUser } from "../lib/user";
import { loadConfiguration, generateToken } from "../common";
const chance = require("chance").Chance();
import {
    host,
    setupBeforeAll,
    setupBeforeEach,
    teardownAfterAll,
    teardownAfterEach,
} from "../common";

describe("Test loading the configuration", () => {
    test("it should be able to load the default configuration for the environment", async () => {
        let response = await fetch(`${host}/configuration`);
        expect(response.status).toEqual(200);
        let configuration = await response.json();
        expect(configuration).toHaveProperty("ui");
    });
});

describe("Test the /authenticated endpoint", () => {
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
    test("it should be ok", async () => {
        let configuration = await loadConfiguration();
        let user = users[0];
        let { token, expires } = await generateToken({ configuration, user });

        let response = await fetch(`${host}/authenticated`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(response.status).toBe(200);
    });
    test("it should fail with unauthorised", async () => {
        let response = await fetch(`${host}/authenticated`, {
            headers: { Authorization: `Bearer xxx` },
        });
        expect(response.status).toBe(401);
    });
});
