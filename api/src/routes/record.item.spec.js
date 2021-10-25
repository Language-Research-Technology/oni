import "regenerator-runtime";
import fetch from "node-fetch";
import {host} from "../common";

jest.setTimeout(10000);

describe("Test load records", () => {
  test("it should be able to retrieve 1 record", async () => {
    const arcpId = `arcp://name,ATAP/uts.edu.au`;
    let response = await fetch(`${host}/data?id=${arcpId}`);
    expect(response.status).toEqual(200);
  });
  test("it should be able to retrieve 1 item of the record", async () => {
    const arcpId = `arcp://name,ATAP/uts.edu.au`;
    let response = await fetch(`${host}/data/item?id=arcp://name,ATAP/uts.edu.au&file=files/165/original_2e21ee2bdb706deca25326c1128d745c.jpg`);
    expect(response.status).toEqual(200);
  });
});
