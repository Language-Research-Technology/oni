## REST API Documentation

## Using Swagger

Start docs

```bash
cd api
node swagger.js
```

And open:

http://localhost:3000/docs/#


Note:

- Following the high level document [Oni Architecture Discussion
  ](https://docs.google.com/document/d/1_tkA9bPZCPUFrrJsffutT2pgDDm84BtAFG4dmv5WOlU/edit#heading=h.r5umx9wyjd2i)


### Using the Rest API:

1. /admin/elastic/index

Runs elastic indexer used only with the admin api key

2. /admin/database/index

Runs structural indexer used only with the admin api key

3. /authenticated

Test if user is authenticated

4. /logout

Logs out current user session

5. /auth/memberships

Retrieve user permissions from provider configured

6. /oauth/{provider}/login

You can configure your Oni instance for Github and CILogon

Example:

`/api/oauth/cilogon/login`

Response:

```json
{
"url": "https://test.cilogon.org/authorize?response_type=code&client_id=cilogon%3A%2Fclient_id%2F12345&redirect_uri=https%3A%2F%2Fexample.org.au%2Fauth%2Fcilogon%2Fcallback&scope=openid%2Bprofile%2Bemail%2Borg.cilogon.userinfo%2Boffline_access&state=cilogon",
"code_verifier": "123435",
"provider": "cilogon"
}
```

Then run that URL returned in a browser

Then save the `code` returned, example:

```sh
https://data-uat.ldaca.edu.au/auth/cilogon/callback?code=NB2HI4DTHIXS65DFON2C4Y3JNRXWO33OFZXXEZZPN5QXK5DIGIXTCOBRMI2TIOJXGBSGEOLBMFSTCZRVGA2TAMRXGJRDEYJXGAYTEP3UPFYGKPLBOV2GQ6SHOJQW45BGORZT2MJWG4ZTQMRUGQYDCMJUHETHMZLSONUW63R5OYZC4MBGNRUWMZLUNFWWKPJZGAYDAMBQ&state=cilogon
```

Your browser will receive a session token: Example:

```json
{
"token": "12345.12345"
}
```

Note: You can then use this token to authorize in subsequent calls

7. /

List of Api endpoints available

8. /configuration

Returns ui configuration including licenses and aggregations.

9. /version

Oni Version

10. /object

Structural search and (limited) discovery end-point. Returns summaries only

Combinable filter parameters :

- memberOf=id -> get all the children of id 
  - Example:
  - /object?memberOf=arcp://name,sydney-speaks/corpus/root
- memberOf=id&conformsTo=CollectionProfileURI 
  - Example:
  - /object?memberOf=arcp://name,sydney-speaks/corpus/root&conformsTo=https://purl.archive.org/language-data-commons/profile#Collection
- memberOf=null & conformsTo=collectionProfileURI -> All TOP level collections with a certain profile
  - Example:
  - /object?memberOf=null&conformsTo=https://purl.archive.org/language-data-commons/profile#Collection
- conformsTo=collectionProfileURI
  - Example:
  - /object?conformsTo=https://purl.archive.org/language-data-commons/profile#Collection
- memberOf=null (ie top-level) Get ALL objects which are not a member of anything else apart of ANY collection (and @type - acts like conformsTo?)
  - Example:
  - /object?memberOf=null
- No params - just show paginated list of any object
  - Example:
  - /object
- id ← JUST ONE - get a summary
  - Example:
  - /object?id=arcp://name,sydney-speaks/corpus/root
 
11. /object/meta

Get an RO-Crate Metadata Document with either IDs translated to api compatible or not


  - Return a complete ro-crate from storage
  - /api/object/meta?id=arcp://name,cooee-corpus/corpus/root&noUrid
  - Example:
  - Return an RO-Crate resolving all parts
  - /api/object/meta?resolve-parts&noUrid&id=arcp://name,sydney-speaks/corpus/root
  - Example:
  - Return an RO-Crate resolving all parts and return each id prefixed with the https endpoint of the object so another machine can fetch all items
  - /api/object/meta?resolve-parts&id=arcp://name,cooee-corpus/corpus/root

12. /object/meta/versions

Not implemented

13. /stream

Example:

Stream the file of coooee with path data/1-215-plain.txt

/stream?id=arcp://name,cooee-corpus/corpus/root&path=data/1-114-plain.txt

14. /object/open

Same as /stream but only works with Bearer Token

15./search/index

Search results either unique or a list of results

Examples:

Search in index items with filters: @type=Dataset,RepositoryCollection, _isTopLevel=true
- /api/search/items?filters={"@type":["Dataset","RepositoryCollection"],"_isTopLevel.@value":["true"]}

Search in index items and request a Scroll Id with filters memberOf cooee that conformsTo Objects
- /api/search/items?withScroll=true&filters={"_memberOf.@id":["arcp://name,cooee-corpus/corpus/root"],"conformsTo.@id":["https://purl.archive.org/language-data-commons/profile#Object"]}

Search in index vocabs the exact match of the citation vocab
- /api/search/vocabs?_id=https://purl.archive.org/language-data-commons/terms#citation

Search in index items the files that are of type csv
- /api/search/items?withScroll=true&filters={"@type":["File"],"encodingFormat.@value":["text/csv"]}

Search for the object with id data/1-215-plain.txt in the cooee corpus
- /api/search/items?id=data/1-215-plain.txt&_crateId=arcp://name,cooee-corpus/corpus/root

16. /user

Get User Information of the authenticated user

17. /user/token

Get and set user token of the authenticated user; returns token
