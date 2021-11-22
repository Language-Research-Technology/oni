const axios = require('axios');
const {Octokit} = require("octokit");

async function getFromURL(session) {
  try {
    const response = await axios({
      url: session,
      method: 'get',
      responseType: 'json'
    });
    if (response.status !== 200) {
      return {data: [], error: true}
    } else {
      return {data: response.data}
    }
  } catch (e) {
    throw new Error(e);
  }
}

async function getGroupMembership(user, org) {
  try {
    const octokit = new Octokit({auth: user.accessToken});
    const res = await octokit.request('GET /user/memberships/orgs/{org}', {
      org: org
    })
    console.log("Hello, %s", res.data);
    return res.data;
  } catch (e) {
    console.log(e);
    return {error: e}
  }
}

async function getGroupsMembership({user, org}) {
  try {
    const octokit = new Octokit({auth: user.accessToken});
    const res = await octokit.request('GET /user/orgs', {
      org: org
    });
    //TODO: check if result is paginated
    console.log("Hello, %s", res.data);
    return res.data;
  } catch (e) {
    console.log(e);
    return {error: e}
  }
}

async function getTeamsMembership(user, org, team) {
  try {
    const octokit = new Octokit({auth: user.accessToken});
    const res = await octokit.request('GET /orgs/{org}/teams/{team_slug}/memberships/{username}', {
      org: org,
      team_slug: team,
      username: user.username
    })
    console.log("Hello, %s", res.data);
    return res.data;
  } catch (e) {
    console.log(e);
    return {error: e}
  }
}

async function getTeamMembership({user, group}) {

  // Group is not used right now, because the app can only handle its own groups.
  const octokit = new Octokit({auth: user.accessToken});
  const data = {teams: [], error: null};
  try {
    const res = await octokit.request('GET /user/teams', {
      per_page: 100
    });
    //TODO: It may have pagination!
    res.data.forEach(function (t) {
      data.teams.push({team: t});
    });
  } catch (e) {
    data['error'] = e;
  }
  return data;

}

module.exports = {getFromURL, getGroupMembership, getGroupsMembership, getTeamsMembership, getTeamMembership}
