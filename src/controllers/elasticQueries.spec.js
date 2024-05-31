
import assert from "assert";
import {loadConfiguration} from "../services";
import {noQueryLicenseQuery, boolLicenseQuery, disMaxLicenseQuery, matchLicenseQuery} from "./elasticQueries";

jest.setTimeout(10000);

let licenses = {};
let mockLicenses = {}
let searchBody = {
  "highlight": {
    "fields": {
      "_text": {
        "pre_tags": [
          "<mark class=\"font-bold\">"
        ],
        "post_tags": [
          "</mark>"
        ]
      }
    },
    "number_of_fragments": 3,
    "fragment_size": 150
  },
  "aggs": {
    "_root.name.@value": {
      "terms": {
        "field": "_root.name.@value.keyword",
        "size": 1000
      }
    },
    "_memberOf.name.@value": {
      "terms": {
        "field": "_memberOf.name.@value.keyword",
        "size": 1000
      }
    },
    "license.name.@value": {
      "terms": {
        "field": "license.name.@value.keyword",
        "size": 1000
      }
    },
    "@type": {
      "terms": {
        "field": "@type.keyword",
        "size": 1000
      }
    },
    "language.name.@value": {
      "terms": {
        "field": "language.name.@value.keyword",
        "size": 1000
      }
    },
    "modality.name.@value": {
      "terms": {
        "field": "modality.name.@value.keyword",
        "size": 1000
      }
    },
    "linguisticGenre.name.@value": {
      "terms": {
        "field": "linguisticGenre.name.@value.keyword",
        "size": 1000
      }
    },
    "encodingFormat.@value": {
      "terms": {
        "field": "encodingFormat.@value.keyword",
        "size": 1000
      }
    },
    "annotationType.@value": {
      "terms": {
        "field": "annotationType.@value.keyword",
        "size": 1000
      }
    }
  }
}

beforeAll(async () => {
  const configuration = await loadConfiguration();
  mockLicenses = configuration['api']['licenses'];
  licenses = configuration['api']['licenses'];
});

describe('Test elastic queries', () => {
  test('it should append bool query with filter without a query', async () => {
    searchBody = noQueryLicenseQuery({searchBody, licenses, clause: 'must_not'});
    //console.log(JSON.stringify(searchBody));
    assert(searchBody.hasOwnProperty('query'), true);
    assert(searchBody.query.hasOwnProperty('bool'), true);
    assert(Array.isArray(searchBody.query.bool.must_not), true);
  });

  test('it should wrap a clause in a bool clause', async () => {
    searchBody['query'] = {
      "bool": {
        "must": {
          "terms": {
            "_collectionStack.@id.keyword": [
              "arcp://name,griffith/corpus/root"
            ]
          }
        }
      }
    }
    searchBody = boolLicenseQuery({searchBody, licenses, clause: 'must_not'});
    //console.log(JSON.stringify(searchBody));
    assert(searchBody.hasOwnProperty('query'), true);
    assert(searchBody.query.hasOwnProperty('bool'), true);
    assert(Array.isArray(searchBody.query.bool.must_not), true);
    assert(Array.isArray(searchBody.query.bool.must), true);
  });

  test('it should wrap a clause in a dis_max clause', async () => {
    searchBody['query'] = {
      "dis_max": {
        "queries": [
          {
            "match": {
              "@id": "Transcrp+-+Suzanne+&+Len.docx"
            }
          },
          {
            "match": {
              "_crateId": "arcp://name,latrobe/transcript/Dialogue-SuzanneLen"
            }
          }
        ]
      }
    }
    searchBody = disMaxLicenseQuery({searchBody, licenses, clause: 'must_not'});
    //console.log(JSON.stringify(searchBody));
    assert(searchBody.hasOwnProperty('query'), true);
    assert(searchBody.query.hasOwnProperty('bool'), true);
    assert(Array.isArray(searchBody.query.bool.must_not), true);
    assert(Array.isArray(searchBody.query.bool.dis_max), true);
  });

  test('it should wrap a clause in a match clause', async () => {
    searchBody['query'] = {
      "match": {
        "@id": "Transcrp+-+Suzanne+&+Len.docx"
      }
    }
    searchBody = matchLicenseQuery({searchBody, licenses, clause: 'must_not'});
    console.log(JSON.stringify(searchBody));
    assert(searchBody.hasOwnProperty('query'), true);
    assert(searchBody.query.hasOwnProperty('bool'), true);
    assert(Array.isArray(searchBody.query.bool.must_not), true);
    assert(Array.isArray(searchBody.query.bool.match), true);
  });

});
