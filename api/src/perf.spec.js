import "regenerator-runtime";
import fetch from "node-fetch";
import {createUser} from "../lib/user";
import {loadConfiguration, generateToken} from "../common";

const chance = require("chance").Chance();
import {
  host,
  setupBeforeAll,
  setupBeforeEach,
  teardownAfterAll,
  teardownAfterEach,
} from "../common";

describe("Load test API", () => {
  it("Should have started", async () => {
    let response = await fetch(`${host}/configuration`);
    expect(response.status).toEqual(200);
    let configuration = await response.json();
    expect(configuration).toHaveProperty("ui");
  });

  it("Should create random ro-crates and store them", async () => {
    const sourcedata = await randomize.loadsourcedata('./vocabularies');
    const datapubs = randomize.randdatapubs(n, sourcedata);
  });

});
