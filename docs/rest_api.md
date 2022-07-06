## (WIP) REST API Documentation

HTTP GET
```
/data
```

Optional query parameters
- offset: offset of request
- limit: limit of items per request
- id: unique arcpId of collection
- members:  returns the members of the same group of data
- types: returns the values of the root types of the crate
- conformsTo: returns the values of conforms to from the root dataset
- get:
    - 'raw': gets the original metadata file
    - if get is empty it will translate all ids of file type translated to URIs

Examples:
1.
```
GET
https://oni-dev.text-commons.org/data
Description:
Lists all metadata collections in the repository paginated
```
2.
```
GET
https://oni-dev.text-commons.org/data?id=arcp://name,ATAP/uts.edu.au
Description:
Returns a metadata json with URIs for files translated into URIs of /data/item which can be downloaded
The json file should be a valid ro-crate. Which can be consumed by ro-crate-py or others.
```

HTTP GET
```
/data/item
```
Required Parameters:
- id: arcpId of collection
- file: id of file from repository

Example:
```
GET
https://oni-dev.text-commons.org/data/item?id=arcp://name,ATAP/uts.edu.au&file=files/428/original_9272b6baee88c7f026d3a2ef6c4d78a4.csv
Description: 
Download a file from the repository arcp://name,ATAP/uts.edu.au and name it original_9272b6baee88c7f026d3a2ef6c4d78a4.csv
```

Note:

- Following the high level document [Oni Architecture Discussion
  ](https://docs.google.com/document/d/1_tkA9bPZCPUFrrJsffutT2pgDDm84BtAFG4dmv5WOlU/edit#heading=h.r5umx9wyjd2i)
