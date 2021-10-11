import { loadConfiguration } from "../common";
import { writeJSON } from "fs-extra";
import { cloneDeep } from "lodash";
import models from "../models";

export const host = `http://localhost:8080`;

export async function setupBeforeAll({ adminEmails = [] }) {
    let configuration = await loadConfiguration();

    let devConfiguration = cloneDeep(configuration);
    devConfiguration.api.administrators = adminEmails;
    await writeJSON("/srv/configuration/development-configuration.json", devConfiguration, {
        spaces: 4,
    });
    return configuration;
}

export async function setupBeforeEach({ emails }) {
    let users = [];
    for (let email of emails) {
        let user = await models.user.create({
            email: email,
            provider: "unset",
            locked: false,
            upload: false,
            administrator: false,
        });
        users.push(user);
    }
    return users;
}

export async function teardownAfterEach({ users = [] }) {
    for (let user of users) {
        await user.destroy();
    }
}

export async function teardownAfterAll(configuration) {
    await writeJSON("/srv/configuration/development-configuration.json", configuration, {
        spaces: 4,
    });
    models.sequelize.close();
}
