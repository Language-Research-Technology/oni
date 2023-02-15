import {getLogger} from "../services";

const log = getLogger();

export function noQueryLicenseQuery({searchBody, licenses, clause}) {
  log.debug('noQueryLicenseQuery');
  searchBody['query'] = {};
  searchBody.query['bool'] = {};
  searchBody.query.bool[clause] = [];
  for (let license of licenses) {
    // console.log(JSON.stringify(license.license));
    const licenseQuery = {match: {"license.@id.value": license.license}};
    searchBody.query.bool[clause].push(licenseQuery);
  }
  return searchBody;
}

export function boolLicenseQuery({searchBody, licenses, clause}) {
  log.debug('boolLicenseQuery');
  searchBody.query.bool[clause] = [];
  for (let license of licenses) {
    // console.log(JSON.stringify(license.license));
    const licenseQuery = {match: {"license.@id.value": license.license}};
    searchBody.query.bool[clause].push(licenseQuery);
  }
  return searchBody;
}

export function disMaxLicenseQuery({searchBody, licenses, clause}) {
  log.debug('disMaxLicenseQuery');
  const disMax = searchBody.query.dis_max;
  searchBody.query = {bool: {}};
  searchBody.query.bool[clause] = [];
  searchBody.query.bool['must'] = {};
  for (let license of licenses) {
    // console.log(JSON.stringify(license.license));
    const licenseQuery = {match: {"license.@id.value": license.license}};
    searchBody.query.bool[clause].push(licenseQuery);
  }
  searchBody.query.bool.must['dis_max'] = disMax;
  return searchBody;
}

export function matchLicenseQuery({searchBody, licenses, clause}) {
  log.debug('matchLicenseQuery');
  const match = searchBody.query.match;
  searchBody.query = {bool: {}};
  searchBody.query.bool[clause] = [];
  searchBody.query.bool['must'] = {};
  for (let license of licenses) {
    // console.log(JSON.stringify(license.license));
    const licenseQuery = {match: {"license.@id.value": license.license}};
    searchBody.query.bool[clause].push(licenseQuery);
  }
  searchBody.query.bool.must['match'] = match;
  return searchBody;
}

export function matchAllLicenseQuery({searchBody, licenses, clause}) {
  log.debug('matchAllLicenseQuery');
  const match = searchBody.query.match_all;
  searchBody.query = {bool: {}};
  searchBody.query.bool[clause] = [];
  searchBody.query.bool['must'] = {};
  for (let license of licenses) {
    // console.log(JSON.stringify(license.license));
    const licenseQuery = {match: {"license.@id.value": license.license}};
    searchBody.query.bool[clause].push(licenseQuery);
  }
  searchBody.query.bool.must['match_all'] = match;
  return searchBody;
}

export function boolFilterQuery({searchBody, licenses, clause, current}) {
  log.debug('boolFilterQuery2');
  const supportedClauses = ['bool', 'dis_max', 'match', 'match_all', 'terms', 'range'];

  if (!searchBody.hasOwnProperty('query')) {
    current = 'query';
    searchBody['query'] = {}
  } else {
    current = supportedClauses.find((c) => searchBody.query.hasOwnProperty(c));
  }
  console.log('current');
  console.log(current);
  if (current) {
    const currentQuery = searchBody.query[current];
    searchBody.query = {bool: {must: {}}};
    searchBody.query.bool.must[clause] = [];
    if (current !== 'bool') {
    }
    console.log(JSON.stringify(searchBody));
    searchBody.query.bool['must'] = [];
    for (let license of licenses) {
      // console.log(JSON.stringify(license.license));
      const licenseQuery = {match: {"license.@id.value": license.license}};
      searchBody.query.bool.must[clause].push(licenseQuery);
    }
    searchBody.query[current] = currentQuery;
    return searchBody;
  } else {
    return null;
  }
}


