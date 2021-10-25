import "regenerator-runtime";
import fetch from "node-fetch";
import {host} from "../common";

jest.setTimeout(10000);

describe("Test load records", () => {
  test("it should be able to retrieve records", async () => {
    let response = await fetch(`${host}/data`);
    expect(response.status).toEqual(200);
    let res = await response.json();
    expect(res.data.length).toBeGreaterThanOrEqual(0);
  });
  test("it should be able to retrieve 1 record", async () => {
    const arcpId = `arcp://name,ATAP/uts.edu.au`;
    let response = await fetch(`${host}/data?arcpId=${arcpId}`);
    expect(response.status).toEqual(200);
    let res = await response.json();
    expect(res.arcpId).toEqual(arcpId);
  });
});
