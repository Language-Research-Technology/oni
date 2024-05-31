import packageJson from "../package.json" with { type: 'json' };
export default {
  package: packageJson,
  "ui": {
    "siteName": "Oni",
    "siteNameX": "Portal",
    "publicPath": "http://localhost:9000/",
    "title": "Oni Portal",
    "shortTitle": "Oni",
    "splashText": "Splash text",
    "splashTextClass": "text-5xl text-[#F4EDE4] pb-10",
    "splashImage": "splash-background-1.png",
    "splashEnabled": true,
    "splashLauncher": "Acknowledgement of Country",
    "showLogo": true,
    "navHeight": "80px",
    "showNotebooks": false,
    "showEllipsis": true,
    "help": {
      "mainText": "For access please email help@example.com",
      "helpUrl": "https://www.example.com",
      "citationText": "How to cite: <add in configuration>"
    },
    "subHelpLinks": [],
    "terms": {
      "text": "Example terms of service",
      "href": "/terms",
      "title": "Terms of Service"
    },
    "email": {
      "help": "help@example.com"
    },
    "footer": {
      "copyright": "© 2023",
      "link": {
        "href": "https://ldaca.edu.au",
        "text": "Language Data Commons of Australia"
      }
    },
    "login": {
      "enabled": true
    },
    "authorizationProvider": {
      "label": "REMS",
      "url": "https://rems-uat.ldaca.edu.au/applications"
    },
    "loginProviders": [
      {
        "name": "github",
        "text": "Sign in with Github",
        "disabled": false,
        "loginRoute": "/oauth/github/login",
        "buttonStyle": "background: rgba(88 115 181)"
      },
      {
        "name": "cilogon",
        "text": "Sign in with CILogon",
        "disabled": false,
        "loginRoute": "/oauth/cilogon/login",
        "buttonStyle": "background: rgba(76 60 185)"
      }
    ],
    "enrollment": {
      "enforced": true,
      "URL": ""
    },
    "topNavItems": [ {
      "route": "search?f=%257B%2522%2540type%2522%253A%255B%2522RepositoryCollection%2522%255D%252C%2522_isTopLevel.%2540value%2522%253A%255B%2522true%2522%255D%257D",
      "display": "Top Collections"
      }, {
        "route": "search?f=%257B%2522%2540type%2522%253A%255B%2522RepositoryCollection%2522%255D%257D",
        "display": "Collections"
        },
      {
      "route": "/search?f=%257B%2522%2540type%2522%253A%255B%2522SoftwareApplication%2522%255D%257D",
      "display": "Notebooks"
    }],
    "search": {
      "sorting": [
        {"value": "relevance", "label": "Relevance"},
        {"value": "_isTopLevel.@value.keyword", "label": "Collections"},
        {"value": "name", "label": "Name", "field": "name.@value.keyword"}
      ],
      "searchSorting": {"value": "relevance", "label": "Relevance"},
      "startSorting": {"value": "_isTopLevel.@value.keyword", "label": "Collections"},
      "defaultSorting": {"value": "relevance", "label": "Relevance"},
      "ordering": [
        {"value": "asc", "label": "Ascending"},
        {"value": "desc", "label": "Descending"}
      ],
      "defaultOrder": {"value": "desc", "label": "Descending"},
      "searchDetails": [
        {"field":"inLanguage", "label": "Language", "name": "inLanguage.name.@value"}
      ]
    },
    "main": {
      "fields": [
        {
          "display": "Language",
          "name": "language.name.@value"
        },
        {
          "display": "Linguistic Genre",
          "name": "linguisticGenre.name.@value"
        },
        {
          "display": "Modality",
          "name": "modality.name.@value"
        },
        {
          "display": "Annotation Type",
          "name": "annotationType.@value"
        },
        {
          "display": "File Formats",
          "name": "encodingFormat.@value"
        }
      ],
      "byteFields": [
        "size",
        "contentSize"
      ],
      "expand": [
        "speaker",
        "citation",
        "spatialCoverage"
      ]
    },
    "collection": {
      "name": {
        "display": "Name",
        "name": "name"
      },
      "top": [
        {
          "display": "Name",
          "name": "name"
        },
        {
          "display": "Description",
          "name": "description"
        },
        {
          "display": "Date Published",
          "name": "datePublished"
        }
      ],
      "meta": {
        "hide": [
          "name",
          "description",
          "datePublished",
          "license",
          "@type",
          "_containsTypes",
          "_crateId",
          "_isRoot",
          "_isTopLevel",
          "_root",
          "hasPart",
          "hasMember",
          "_memberOf",
          "_isSubLevel",
          "memberOf",
          "_access",
          "_collectionStack",
          "_metadataIsPublic",
          "_metadataLicense",
          "identifier",
          "_mainCollection",
          "_subCollection"
        ],
        "displayHasMember": false,
        "displayHasPart": true
      },
      "relationships": [{"name":"notebook", "display":"Notebooks", "type":"SoftwareApplication"}]
    },
    "object": {
      "name": {
        "display": "Name",
        "name": "name"
      },
      "top": [
        {
          "display": "Name",
          "name": "name"
        },
        {
          "display": "Description",
          "name": "description"
        },
        {
          "display": "Date Published",
          "name": "datePublished"
        }
      ],
      "meta": {
        "hide": [
          "_memberOf",
          "name",
          "description",
          "datePublished",
          "identifier",
          "license",
          "@type",
          "_containsTypes",
          "_crateId",
          "_isRoot",
          "_isTopLevel",
          "_root",
          "hasPart",
          "hasMember",
          "error",
          "_parent",
          "_access",
          "indexableText",
          "_access",
          "_collectionStack",
          "_metadataIsPublic",
          "_metadataLicense",
          "_mainCollection",
          "_subCollection"
        ]
      }
    },
    "file": {
      "meta": {
        "hide": [
          "name",
          "@type",
          "_access",
          "_crateId",
          "_parent",
          "_memberOf",
          "_root",
          "_text",
          "_collectionStack",
          "_metadataIsPublic",
          "_metadataLicense",
          "_mainCollection",
          "_subCollection"
        ]
      }
    },
    "notebook": {
      "name": {
        "display": "Name",
        "name": "name"
      },
      "top": [
        {
          "display": "Name",
          "name": "name"
        },
        {
          "display": "Description",
          "name": "description"
        },
        {
          "display": "Date Published",
          "name": "datePublished"
        }
      ],
      "meta": {
        "hide": [
          "name",
          "description",
          "@type",
          "datePublished",
          "gitName",
          "gitRepo",
          "url",
          "binderLink",
          "base64",
          "_access",
          "_metadataIsPublic",
          "_metadataLicense",
          "_mainCollection",
          "_subCollection"
        ],
        "displayHasMember": false,
        "displayHasPart": false
      }
    },
     "analytics": {
      "gaMeasurementId": "G-YK7QTG4116"
    }
  },
  "api": {
    "openapi": {
      "enabled": true
    },
    "origins": [{ "host": "", "key": "", "secret": "" }],
    "bootstrap": false,
    "log": {
      "logFolder": "/opt/storage/oni/logs"
    },
    "host": "",
    "basePath": "/api",
    "ocfl": {
      "ocflPath": "/opt/storage/oni/ocfl",
      "ocflScratch": "/opt/storage/oni/scratch-ocfl",
      "ocflTestPath": "/opt/storage/oni/test/ocfl",
      "ocflTestScratch": "/opt/storage/oni/test/scratch-ocfl",
      "catalogFilename": "ro-crate-metadata.json",
      "hashAlgorithm": "md5",
      "create": {
        "repoName": "ATAP",
        "collections": "../test-data/ingest-crate-list.development.json"
      }
    },
    "rocrate": {
      "dataTransform": {
        "types": [
          "File"
        ]
      }
    },
    "administrators": [
      "admin@example.com"
    ],
    "session": {
      "lifetime": {
        "hours": 5
      },
      "secret": process.env.SESSION_SECRET || "some_secret_-_32_characters_or_longer"
    },
    "tokens": {
      "secret": process.env.TOKEN_SECRET || "token_secret",
      "accessTokenPassword": process.env.TOKEN_PASSWORD || "90655144805fa21a01331fe639a15616",
      "admin": process.env.TOKEN_ADMIN || "1234-1234-1234-1234"
    },
    "services": {},
    "authorization": {
      "provider": "rems",
      "enrollment": {
        "enforced": false,
        "groups": [
          "CO:Members:all"
        ],
        "URL": "https://registry-test.ldaca.edu.au/registry/co_petitions/start/coef:9"
      },
      "rems": {
        "apiUser": process.env.REMS_API_USER || "<rems_user>",
        "apiKey": process.env.REMS_API_KEY || "<api_key>",
        "apiHost": "https://rems.ldaca.edu.au/api"
      }
    },
    "authentication": {
      "cilogon": {
        "clientID": process.env.CILOGON_ID || "",
        "clientSecret": process.env.CILOGON_SECRET || "",
        "redirectPath": "/auth/cilogon/callback",
        "authorizeHost": "https://cilogon.org",
        "authorizePath": "/authorize",
        "tokenHost": "https://cilogon.org",
        "tokenPath": "/oauth2/token",
        "user": "https://cilogon.org/oauth2/userinfo",
        "bearer": "token",
        "scope": "openid+profile+email+org.cilogon.userinfo",
        "state": "cilogon",
        "oauthType": "AuthorizationCode",
        "useFormData": true,
        "memberOf": "is_member_of",
        "userid": "sub",
        "username": "sub"
      },
      "github": {
        "clientID": process.env.GITHUB_ID || "",
        "clientSecret": process.env.GITHUB_SECRET || "",
        "redirectPath": "/auth/github/callback",
        "authorizeHost": "https://github.com",
        "authorizePath": "/login/oauth/authorize",
        "tokenHost": "https://github.com",
        "tokenPath": "/login/oauth/access_token",
        "user": "https://api.github.com/user",
        "bearer": "token",
        "scope": "read:org, user",
        "state": "github",
        "oauthType": "ClientCredentials",
        "useHeaders": true
      }
    },
    "licenses": [
      {
        "license": "https://www.dynamicsoflanguage.edu.au/sydney-speaks/licence/A/",
        "group": "sydney-speaks-license-a",
        "enrollment": {
          "url": "https://registry-test.ldaca.edu.au/registry/co_petitions/start/coef:20",
          "label": "Follow enrolment to Sydney Speaks License A",
          "class": ""
        }
      },
      {
        "license": "https://www.dynamicsoflanguage.edu.au/sydney-speaks/licence/B/",
        "group": "sydney-speaks-license-b",
        "enrollment": {
          "url": "https://registry-test.ldaca.edu.au/registry/co_petitions/start/coef:36",
          "label": "Follow this link to enrol for access to Sydney Speaks B License",
          "class": ""
        }
      },
      {
        "license": "https://www.dynamicsoflanguage.edu.au/sydney-speaks/licence/C/",
        "group": "sydney-speaks-license-c",
        "enrollment": {}
      },
      {
        "license": "https://www.dynamicsoflanguage.edu.au/sydney-speaks/licence/D/",
        "group": "sydney-speaks-license-d",
        "enrollment": {
          "url": "https://registry-test.ldaca.edu.au/registry/co_petitions/start/coef:33",
          "label": "Follow enrolment to Sydney Speaks License D",
          "class": ""
        }
      },
      {
        "license": "#restricted",
        "group": "restricted-users",
        "access": "loginPlus",
        "enrollment": {
          "url": "",
          "label": "",
          "class": ""
        }
      }
    ],
    "licenseGroup": "text-commons",
    "license": {
      "default": {
        "@id": "https://choosealicense.com/no-permission/",
        "@type": "OrganizationReuseLicense",
        "metadataIsPublic": true,
        "allowTextIndex": true,
        "name": "Default LDaCA No License",
        "description": "No License"
      },
      "defaultMetadata": {
        "isPublic": true,
        "name": "Attribution 4.0 International (CC BY 4.0)",
        "id": "https://creativecommons.org/licenses/by/4.0/",
        "description": "You are free to:\nShare — copy and redistribute the material in any medium or format\nAdapt — remix, transform, and build upon the material\nfor any purpose, even commercially.\nThis license is acceptable for Free Cultural Works.\nThe licensor cannot revoke these freedoms as long as you follow the license terms."
      }
    },
    "identifier": {
      "main": "LDaCA"
    },
    "elastic": {
      "bootstrap": false, 
      "node": `http://${process.env.SEARCH_HOST || 'localhost'}:${process.env.SEARCH_PORT || '9200'}`,
      "maxScroll": 5000,
      "scrollTimeout": "10m",
      "log": "debug",
      "index": "items",
      "indexConfiguration": {
        "mapping": {
          "total_fields": {
            "limit": 1000
          }
        },
        "max_result_window": 100000,
        "highlight": {
          "max_analyzer_offset": 1000000
        }
      },
      "fields": {
        "name.@value": {
          "label": "Name",
          "checked": true
        },
        "description.@value": {
          "label": "Description",
          "checked": true
        },
        "inLanguage.name.@value": {
          "label": "Language",
          "checked": true
        },
        "_text": {
          "label": "Text",
          "checked": true
        }
      },
      "aggregations": [
        {
          "display": "Collection",
          "order": 1,
          "name": "_memberOf.name.@value",
          "field": "_memberOf.name.@value.keyword",
          "hide": true
        },
        {
          "display": "Collection",
          "order": 1,
          "name": "_mainCollection.name.@value",
          "field": "_mainCollection.name.@value.keyword",
          "active": true,
          "help": "A group of related objects such as a corpus, a sub-corpus, or items collected in a session with consultants."
        },
        {
          "display": "Sub-Collection",
          "order": 2,
          "name": "_subCollection.name.@value",
          "field": "_subCollection.name.@value.keyword",
          "active": false,
          "help": "The sub-collections, if any, associated with a collection."
        },
        {
          "display": "License",
          "order": 0,
          "name": "license.@id",
          "field": "license.@id.keyword",
          "hide": true,
          "icons": true
        },
        {
          "display": "Access",
          "order": 2,
          "name": "license.name.@value",
          "field": "license.name.@value.keyword",
          "help": "The access conditions associated with a resource."
        },
        {
          "display": "Record Type",
          "order": 3,
          "name": "@type",
          "field": "@type.keyword",
          "help": "The type of object a record describes, i.e. a collection, object or file. For individual files, this field also gives information about the nature of the material, i.e. primary material, transcription, annotation etc."
        },
        {
          "display": "Language",
          "order": 4,
          "name": "inLanguage.name.@value",
          "field": "inLanguage.name.@value.keyword",
          "help": "The language(s) of the content in this resource."
        },
        {
          "display": "Communication Mode",
          "order": 5,
          "name": "communicationMode.name.@value",
          "field": "communicationMode.name.@value.keyword",
          "help": "The mode(s) (spoken, written, signed, etc.) used in the interaction represented by this resource.",
          "icons": true
        },
        {
          "display": "Linguistic Genre",
          "order": 6,
          "name": "linguisticGenre.name.@value",
          "field": "linguisticGenre.name.@value.keyword",
          "help": "The linguistic classification of the genre of this resource."
        },
        {
          "display": "File Format",
          "order": 7,
          "name": "encodingFormat.@value",
          "field": "encodingFormat.@value.keyword",
          "help": "The media type of the resource.",
          "icons": true
        },
        {
          "display": "Annotation Type",
          "order": 8,
          "name": "annotationType.@value",
          "field": "annotationType.@value.keyword"
        }
      ],
      "highlightFields": [
        "_text"
      ],
      "test": {
        "filters": {
          "hasFile.language.name": [
            "Arabic, Standard",
            "Chinese, Mandarin",
            "Persian, Iranian",
            "Turkish",
            "Vietnames"
          ]
        },
        "@type": [
          "TextDialogue"
        ]
      },
      "mappingFieldLimit": 3000,
      "mappings": {
        "date_detection": false,
        "properties": {
          "@id": {
            "type": "keyword"
          },
          "hasPart": {},
          "hasFile": {
            "type": "nested",
            "properties": {
              "language": {
                "type": "nested",
                "properties": {
                  "name": {
                    "type": "nested",
                    "properties": {
                      "@value": {
                        "type": "keyword"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "admin": {
      "indexRoutes": true
    },
    "conformsTo": {
      "collection": "https://w3id.org/ldac/profile#Collection",
      "object": "https://w3id.org/ldac/profile#Object",
      "notebook": "https://w3id.org/ldac/profile#Notebook"
    },
    "skipByMatch": [
      "arcp://name,austalk/*."
    ]
  }
}
