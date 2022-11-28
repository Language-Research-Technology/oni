import {Octokit} from "@octokit/core";
import {getLogger} from "./logger";
import {filter} from 'lodash';

const log = getLogger();

export async function getOctoKit(accessToken) {
  try {
    const octokit = new Octokit({auth: accessToken});
    return octokit
  } catch (e) {
    console.log(e);
    return {error: e}
  }
}

export async function getGroupMembership({octokit, org}) {
  try {
    const res = await octokit.request('GET /user/memberships/orgs/{org}', {
      org: org
    });
    console.log("Hello, %s", res.data);
    return res.data;
  } catch (e) {
    console.log(e);
    return {error: e}
  }
}

export async function getGroupsMembership({octokit, org}) {
  try {
    const res = await octokit.request('GET /user/orgs', {
      org: org
    });
    //TODO: check if result is paginated
    console.log("Hello, %s", res.data);
    return res.data;
  } catch (e) {
    log.error(e);
    return {error: e}
  }
}

export async function getTeamsOfOrg({octokit, group}) {
  log.debug("getTeamsOfOrg")
  const data = {teams: [], error: null};
  let res;
  try {
    res = await octokit.request('GET /orgs/{org}/teams', {
      org: group,
      per_page: 100
    });
    //TODO: It may have pagination!
    if (Array.isArray(res.data)) {
      res.data.forEach(function (t) {
        data.teams.push({team: t});
      });
    }
  } catch (e) {
    log.error(e);
    data.error = e.message;
  }
  return data;

}

//https://docs.github.com/en/rest/teams/members#get-team-membership-for-a-user
export async function getTeamMembershipForUser({octokit, username, group, teams}) {
  log.debug("getTeamMembershipForUser");
  const data = {teams: [], error: null};
  try {
    for (let t of teams) {
      let res;
      try {
        res = await octokit.request('GET /orgs/{org}/teams/{team_slug}/memberships/{username}', {
          org: group,
          team_slug: t.team.slug,
          username: username,
          per_page: 100
        });
        if (res.status === 200) {
          /* Example return. So only need to check if 200
          {
            state: 'active',
            role: 'maintainer',
            url: 'https://api.github.com/organizations/89755782/team/5153922/memberships/moisbo'
          }
          */
          data.teams.push({team: t.team});
        }
      } catch (e) {
        //Nothing to do here.
        //Will return 404 if user has no team membership
      }
    }
  } catch (e) {
    log.error(e);
    data.error = e.message;
  }
  return data;

}

export async function getGithubUser({user}) {
  try {
    const octokit = new Octokit({auth: user.accessToken});
    const res = await octokit.request('GET /user');
    //TODO: check if result is paginated
    log.debug("Hello, %s", res.data['login']);
    return res.data;
  } catch (e) {
    log.error(e);
    return {error: e}
  }
}

export async function getGithubToken({authGithub, code, verifier}) {
  //Github Auth Flow: https://github.com/github/developer.github.com/blob/master/content/v3/oauth.md

  const response = await fetch(`${authGithub['discover']}/login/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: authGithub['clientID'],
      client_secret: authGithub['clientSecret'],
      redirect_uri: authGithub['redirectUri'],
      code: code,
      state: verifier
    })
  });
  const token = await response.json();
  return token;
}

export function filterMemberships({teamMembership}) {
  //TODO: what if you have multiple groups
  const teams = [];
  for (const {team} of teamMembership?.teams) {
    teams.push({group: team['slug'], description: team['description']});
  }
  return teams;
}
