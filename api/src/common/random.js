import randomWord from 'random-word';
import {camelCase, sample, sampleSize, startCase, clone, upperFirst} from 'lodash';
import {v4 as uuidv4} from 'uuid';
import DateGenerator from 'random-date-generator';
import * as fs from 'fs-extra';
import * as path from 'path';


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


function int(min, max) {
  return Math.floor(float(min, max));
}

function float(min, max) {
  return Math.random() * (max - min) + min;
}

export function arrayFill(n, fn) {
  return Array(n).fill(0).map(fn);
}

export function organization(sourceData, orgTypes) {
  const name = sample(sourceData['surnames']) + " " + sample(orgTypes);
  const id = `https:/ror.org/${uuidv4()}`;
  return {
    '@id': id,
    '@type': 'Organization',
    'name': name,
  }
}

export function keyword() {
  return randomWord();
}

export function sentence() {
  const nwords = int(SENTENCE_MIN, SENTENCE_MAX);
  const s = arrayFill(nwords, randomWord).join(' ') + '.';
  return upperFirst(s);
}

export function text() {
  const nsentences = int(PARA_MIN, PARA_MAX);
  return arrayFill(nsentences, sentence).join(' ') + '\n';
}

export function geoPoint() {
  const lat = float(-90, 90);
  const long = float(-180, 180);
  return {
    "@type": "GeoCoordinates",
    "latitude": lat,
    "longitude": long
  }
}

export function placeName() {
  const nwords = int(1, 3);
  return upperFirst(arrayFill(nwords, keyword).join(''));
}

export function person(sourceData, orgs, honorifics) {
  const honorific = sample(honorifics);
  const surname = sample(sourceData['surnames']);
  const givenname = sample(sourceData['givennames']);
  const name = givenname + ' ' + surname;
  const email = givenname + '.' + surname + '@' + EMAIL_DOMAIN;
  const id = `arcp://uuid,${uuidv4()}`;
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

export function license(licenses) {
  //TODO - add more licenses for access control testing
  const id = int(0, licenses.length);
  const newLicense = licenses[id];
  return newLicense;
}

export function dataFile(sourceData, types) {

  return {
    "@id": fabulousId()
  }
}

export function collection({sourceData, keywords, people, files}) {
  const startDate = new Date(2010, 1, 1);
  const endDate = new Date(2020, 12, 31);
  const k = sampleSize(keywords, int(N_KEYWORD_MIN, N_KEYWORD_MAX));
  const title = startCase(camelCase(sentence()));
  const desc = text();
  const creators = clone(sample(people, int(N_PEOPLE_MIN, N_PEOPLE_MAX)));
  const name = placeName();
  const geo = geoPoint();
  const licenseElement = license(sourceData['licenses']);
  const files = dataFile(sourceData['files'], FILES_TYPES);

  const collectionElement = {
    keywords: k,
    author: creators,
    name: title,
    description: desc,
    datePublished: DateGenerator.getRandomDateInRange(startDate, endDate).toISOString().slice(0, 10),
    spatialCoverage: {
      "@id": "#spatialCoveragePlace",
      "name": name,
      "geo": geo
    },
    license: licenseElement,
    files: {
      "@type": "Dataset",
      "@id": "files",
      "name": "Files",
      "description": text(),
      "hasPart": files.map((f) => {
        return {"@id": f['@id']}
      })
    }
  }
  return {collectionElement, ...files}
}


function fabulousId() {
  const id = `arcp://uuid,${uuidv4()}`;
  return id;
}
