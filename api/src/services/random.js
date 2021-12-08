require('regenerator-runtime/runtime');
const randomWord = require('random-word');
const { camelCase, sample, sampleSize, startCase, clone, upperFirst, concat, flatten } = require('lodash');
const uuidv4 = require('uuid').v4;
const DateGenerator = require('random-date-generator');
const fs = require('fs-extra');
const path = require('path');

const EMAIL_DOMAIN = 'examples.edu';

const NAME_MIN = 3;
const NAME_MAX = 10;
const KEYWORD_MIN = 3;
const KEYWORD_MAX = 12;
const WORD_MIN = 2;
const WORD_MAX = 14;
const SENTENCE_MIN = 3;
const SENTENCE_MAX = 30;
const PARA_MIN = 1;
const PARA_MAX = 10;

const N_KEYWORD_MIN = 2;
const N_KEYWORD_MAX = 10;

const N_PEOPLE_MIN = 1;
const N_PEOPLE_MAX = 5;
const N_ORGS_MIN = 1;
const N_ORGS_MAX = 5;

const START_DATE = new Date(2010, 1, 1);
const END_DATE = new Date(2020, 12, 31);

async function makedir(dest) {
  let id = uuidv4();
  id = id.replace(/-/g, '');
  const createDir = await fs.ensureDir(path.join(dest, id));
  return id;
}

function int(min, max) {
  return Math.floor(float(min, max));
}

function float(min, max) {
  return Math.random() * (max - min) + min;
}

function arrayFill(n, fn) {
  return Array(n).fill(0).map(fn);
}

function organization(sourceData, orgTypes) {
  const name = sample(sourceData['surnames']) + " " + sample(orgTypes);
  const id = `https:/ror.org/${uuidv4()}`;
  return {
    '@id': id,
    '@type': 'Organization',
    'name': name,
  }
}

function keyword() {
  return randomWord();
}

function sentence() {
  const nwords = int(SENTENCE_MIN, SENTENCE_MAX);
  const s = arrayFill(nwords, randomWord).join(' ') + '.';
  return upperFirst(s);
}

function text() {
  const nsentences = int(PARA_MIN, PARA_MAX);
  return arrayFill(nsentences, sentence).join(' ') + '\n';
}

function geoPoint() {
  const lat = float(-90, 90);
  const long = float(-180, 180);
  return {
    "@type": "GeoCoordinates",
    "latitude": lat,
    "longitude": long
  }
}

function placeName() {
  const nwords = int(1, 3);
  return upperFirst(arrayFill(nwords, keyword).join(''));
}

function person(sourceData, orgs, honorifics) {
  const honorific = sample(honorifics);
  const surname = sample(sourceData['surnames']);
  const givenname = sample(sourceData['givennames']);
  const name = givenname + ' ' + surname;
  const email = givenname + '.' + surname + '@' + EMAIL_DOMAIN;
  const id = fabulousId();
  const affiliation = clone(sample(orgs, int(N_ORGS_MIN, N_ORGS_MAX)));
  return {
    '@id': id,
    '@type': 'Person',
    'name': `${honorific} ${name}`,
    'givenName': givenname,
    'familyName': surname,
    'email': email,
    'affiliation': affiliation
  }
}

function license(licenses) {
  //TODO - add more licenses for access control testing
  const id = int(0, licenses.length);
  const newLicense = licenses[id];
  return newLicense;
}

function dataFile(sourceData, types) {

  return {
    "@id": fabulousId()
  }
}

function dataFiles(sourceData, type) {

  const hasFileParts = this.arrayFill(int(1, 30), () => dataFile(sourceData, type));

  return {
    "@id": fabulousId(),
    "@type": "Dataset",
    "name": "Files",
    "description": text(),
    "hasPart": hasFileParts
  }
}

function subMembers({ sourceData, orgs, honorifics, allFiles, memberIds }) {
  return memberIds.map((m) => {
    return {
      "@id": m['@id'],
      "@type": ['RepositoryObject', 'TextDialogue'],
      "name": sentence(),
      "hasFile": allFiles,
      "dateCreated": DateGenerator.getRandomDateInRange(START_DATE, END_DATE).toISOString().slice(0, 10),
      "interviewer": person(sourceData, orgs, honorifics),
      "publisher": orgs[int(1, orgs.length)],
      "description": text()
    }
  });
}

function members({ sourceData, orgs, honorifics, memberIds }) {

  return {
    member: {
      "@id": fabulousId(),
      "name": sentence(),
      "description": text(),
      hasMember: memberIds.map((m) => {
        return { "@id": m['@id'] };
      })
    },
    sub: subMembers({ sourceData, orgs, honorifics, memberIds })
  }
}

function collection({ sourceData, orgs, honorifics, keywords, people, files, fileTypes }) {

  const k = sampleSize(keywords, int(N_KEYWORD_MIN, N_KEYWORD_MAX));
  const title = startCase(camelCase(sentence()));
  const desc = text();
  const creators = clone(sample(people, int(N_PEOPLE_MIN, N_PEOPLE_MAX)));
  const name = placeName();
  const geo = geoPoint();
  const licenseElement = license(sourceData['licenses']);
  const filesElement = files;

  const memberGroups = arrayFill(int(5, 30), function memberGroupGen() {
    const memberIds = arrayFill(int(5, 30), function memberIdgen() {
      return { "@id": fabulousId() }
    });
    const memberObjects = members({ sourceData, orgs, honorifics, allFiles: filesElement, memberIds });
    return memberObjects;
  })
  const collectionElement = {
    "@id": "./",
    keywords: k,
    author: creators,
    name: title,
    description: desc,
    datePublished: DateGenerator.getRandomDateInRange(START_DATE, END_DATE).toISOString().slice(0, 10),
    spatialCoverage: {
      "@id": "#spatialCoveragePlace",
      "name": name,
      "geo": geo
    },
    license: licenseElement,
    hasMember: memberGroups.map((m) => {
      return { "@id": m.member['@id'] };
    })
  }

  let c = [];

  const subs = memberGroups.map((s) => {
    return s.sub;
  })
  c.root = collectionElement;
  c.elements = [filesElement, ...flatten(subs)]
  return c;
}


function fabulousId() {
  const id = `arcp://uuid,${uuidv4()}`;
  return id;
}


module.exports = {
  makedir,
  int,
  float,
  arrayFill,
  organization,
  keyword,
  sentence,
  text,
  geoPoint,
  placeName,
  person,
  license,
  dataFile,
  dataFiles,
  subMembers,
  members,
  collection
}
