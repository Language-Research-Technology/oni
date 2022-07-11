import path from "path";
import * as fs from 'fs-extra';
import {first, isEmpty, isEqual, toArray, isUndefined} from 'lodash';
import {ROCrate} from 'ro-crate';
import {recordResolve} from '../controllers/recordResolve';
import {getLogger} from "../services";
import {getRootConformsTos} from "../controllers/rootConformsTo";
import {getFile, getRawCrate} from "../controllers/record";

/**
 * Class to create an elastic Oni indexer
 */
export class Indexer {
  /**
   * @param {configuration, repository, client} - Oni configuration, OCFL repository, elastic client
   */
  constructor({configuration, repository, client}) {
    this.configuration = configuration;
    this.logFolder = this.configuration.api?.log?.logFolder;
    this.index = this.configuration.api?.elastic?.index;
    this.defaultLicense = this.configuration.api.license?.default || null;
    this.conformsToCollection = this.configuration.api.conformsTo.collection;
    this.conformsToObject = this.configuration.api.conformsTo.object;
    this.repository = repository;
    this.client = client;
    this.log = getLogger();
    this._root = {};
    this.crate = {};
  }

  /*
  * Writes a log file with the elastic object trying to be indexed
  * @param {string} crateId - the id being identified
  * @param {string} fileName - file name
  * @param {Object} normalItem - elastic normalised json
  * @returns
  * */
  async writeLogFile(crateId, fileName, normalItem) {
    this.log.error(`Verify rocrate in ${this.logFolder}`);
    await fs.writeFile(
      path.normalize(
        path.join(this.logFolder, crateId.replace(/[/\\?%*:|"<>]/g, '-') + fileName)
      ), JSON.stringify(normalItem, null, 2)
    );
  }

  /*
  * Start indexing by finding Collections that getRootConformsTos #Collection Profile.
  * Will create elastic objects and index them.
  * If hasMember(s) indexMember.
  * If they don't index subCollections.
  * */
  async indexCollections() {
    this.log.debug('Index Collections');
    try {
      let rootConformsTos = await getRootConformsTos({
        conforms: this.conformsToCollection,
        members: null
      });
      let i = 0;
      if (rootConformsTos?.length && rootConformsTos.length > 0) {
        this.log.info(`Trying to index: ${rootConformsTos.length}`);
      } else {
        this.log.info(`No root conforms from ${this.conformsToCollection}`);
      }
      for (let rootConformsTo of rootConformsTos) {
        const col = rootConformsTo?.dataValues || rootConformsTo;
        i++;
        this.log.info(`Indexing: ${i}: ${col.crateId}`);
        const resolvedCrate = await recordResolve({
          id: col.crateId,
          getUrid: false,
          configuration: this.configuration,
          repository: this.repository
        });
        if (resolvedCrate.error) {
          this.log.error(`cannot resolve collection: ${col.crateId}`);
          this.log.error(resolvedCrate.error);
        } else {
          let collRoot;
          try {
            this.crate = new ROCrate(resolvedCrate, {alwaysAsArray: true, resolveLinks: true});
            collRoot = this.crate.rootDataset;
          } catch (e) {
            this.log.error(`Error resolving Crate: ${col.crateId}`);
            this.log.error(e);
          }
          if (collRoot) {
            const memberOf = col['memberOf'];
            if (!memberOf) {
              collRoot._isTopLevel = 'true';
            } else {
              this.log.error(`${col.crateId} if member of ${col['memberOf']}`);
            }
            collRoot._crateId = col.crateId;
            collRoot._containsTypes = [];
            //SKip if it doesnt conformsTo
            if (this.validateConformsTo(collRoot, this.conformsToCollection)) {
              collRoot._isRoot = 'true';
              this.log.debug('validating license')
              const licenseItemOrId = collRoot?.license || col['record']['license'] || col?.license;
              let validLicense = this.validateLicense(licenseItemOrId);
              if (!validLicense) {
                //put the default one.
                validLicense = this.defaultLicense;
              }
              if (!validLicense) {
                this.log.error('----------------------------------------------------------------');
                this.log.error(`Skipping indexCollections ${collRoot._crateId}, No License Found`);
                this.log.error('----------------------------------------------------------------');
              } else {
                collRoot.license = validLicense;
                const normalRoot = this.crate.getTree({root: collRoot, depth: 2, allowCycle: false});
                this._root = [{
                  '@id': first(collRoot._crateId),
                  '@type': collRoot['@type'],
                  'name': [{'@value': first(collRoot.name)}]
                }];
                this._root.license = collRoot.license;
                if (collRoot._isTopLevel) {
                  this._root.isTopLevel = 'true';
                }
                //root.collection = _root['name'] || root['@id'];
                normalRoot._root = this._root;
                try {
                  const {body} = await this.client.index({
                    index: this.index,
                    body: normalRoot
                  });
                } catch (e) {
                  this.log.error('index normalRoot');
                  await this.writeLogFile(col.crateId, '_normalRoot.json', normalRoot);
                }
                if (collRoot.hasMember && collRoot.hasMember.length > 0) {
                  this.log.debug(`Indexing Members of root`);
                  await this.indexMembers({
                    parent: collRoot,
                    crateId: col.crateId,
                    _memberOf: this._root.concat(),
                  });
                } else {
                  this.log.debug('Indexing SubCollections and objects');
                  await this.indexSubCollections({
                    crateId: col.crateId,
                    _memberOf: this._root.concat(),
                  });
                }
              }
            }
          } else {
            this.log.error(`no root dataset for: ${col.crateId}`);
          }
        }
      }
    } catch (e) {
      this.log.error(`indexCollections: ${JSON.stringify(e)}`);
    }
  }

  /*
  * Indexing by finding Collections that getRootConformsTos #Collection Profile and are members of a crateId
  * Will create elastic objects and index them
  * If hasMember(s) indexMember
  * If they don't indexObjects
  * @param {crateId, _memberOf} - The crateId it should be memberOf and the _memberOf inherited from indexCollections
  * */
  async indexSubCollections({crateId, _memberOf}) {
    this.log.debug('indexSubCollections');
    try {
      let rootConformsTos = await getRootConformsTos({
        conforms: this.conformsToCollection,
        members: crateId
      });
      if (rootConformsTos?.length && rootConformsTos?.length > 0) {
        this.log.info(`Trying to index: ${rootConformsTos.length}`);
      } else {
        this.log.info(`No root conforms in subCollections from ${this.conformsToCollection}`);
      }
      this.log.debug(`SubCollections of ${crateId} : ${rootConformsTos['length'] || 0}`);
      if (rootConformsTos.length > 0) {
        for (let rootConformsTo of rootConformsTos) {
          const col = rootConformsTo['dataValues'] || rootConformsTo;
          this.log.debug(`indexSubCollection: member ${col['crateId']}`);
          //TODO: add version
          const rawCrate = await getRawCrate({repository: this.repository, crateId: col['crateId']});
          this.crate = new ROCrate(rawCrate, {alwaysAsArray: true, resolveLinks: true});
          const subCollRoot = this.crate.rootDataset;
          if (subCollRoot) {
            if (subCollRoot['@type'] && subCollRoot['@type'].includes('RepositoryCollection')) {
              subCollRoot._crateId = col.crateId;
              subCollRoot._containsTypes = [];
              //Skip if it does not conformsTo
              if (this.validateConformsTo(subCollRoot, this.conformsToCollection)) {
                subCollRoot._isSubLevel = 'true';
                //TODO: better license checks
                let validLicense = this.validateLicense(subCollRoot?.license);
                if (!validLicense) {
                  validLicense = this.validateLicense(col.record.dataValues?.license || col.record?.license || first(this._root)?.license);
                }
                if (!validLicense) {
                  //put the default one.
                  validLicense = this.defaultLicense;
                }
                if (!validLicense) {
                  this.log.error('----------------------------------------------------------------');
                  this.log.error(`Skipping indexSubCollections ${subCollRoot._crateId}, No License Found`);
                  this.log.error('----------------------------------------------------------------');
                } else {
                  const normalSubCollRoot = this.crate.getTree({root: subCollRoot, depth: 2, allowCycle: false});
                  //root should be already normalized
                  normalSubCollRoot._root = this._root;
                  const parent = [{
                    '@id': subCollRoot['@id'],
                    '@type': subCollRoot['@type'],
                    name: [{'@value': first(subCollRoot['name'])}]
                  }];
                  normalSubCollRoot._memberOf = _memberOf;
                  try {
                    const {body} = await this.client.index({
                      index: this.index,
                      body: normalSubCollRoot
                    });
                  } catch (e) {
                    this.log.error('Index SubCollection RepositoryCollection normalSubCollRoot');
                    await this.writeLogFile(col.crateId, '_normalSubCollectionItem.json', normalSubCollRoot);
                  }
                  if (subCollRoot.hasMember && subCollRoot.hasMember.length > 0) {
                    this.log.debug(`Indexing Members of root`);
                    await this.indexMembers({
                      parent,
                      crateId: col.crateId,
                      _memberOf: _memberOf.concat(parent)
                    });
                  } else {
                    this.log.debug('Indexing objects of SubCollections');
                    await this.indexObjects({
                      crateId: col.crateId,
                      parent,
                      _memberOf: _memberOf.concat(parent)
                    });
                  }
                }
              }
            }
          }
        }
      } else {
        this.log.debug('if there are no subcollections, just index the objects')
        await this.indexObjects({crateId, parent: this.crate, _memberOf});
      }
    } catch (e) {
      this.log.error(`indexSubCollections: ${JSON.stringify(e)}`);
    }
  }

  /*
  * Indexing the members of the crate get the RepositoryCollection and the RepositoryObject
  * For each RepositoryCollection recurse and get the members
  * Will create elastic objects and index them for each repositoryCollection and RepositoryObject respectively
  * @param {parent, crateId, _memberOf} - The parent crate, crateId it should be memberOf and the _memberOf inherited from indexCollections
  * */
  async indexMembers({parent, crateId, _memberOf}) {
    this.log.debug(`Indexing  members: ${crateId} `);
    try {
      for (let item of this.crate.utils.asArray(parent.hasMember)) {
        if (item['@type'] && item['@type'].includes('RepositoryCollection')) {
          this.log.debug(`Indexing RepositoryCollection of ${item['@id']}`);
          item._crateId = crateId;
          item._containsTypes = [];
          //item.conformsTo = 'RepositoryCollection';
          //Skip if doesnt conformsTo
          if (this.validateConformsTo(item, this.conformsToCollection)) {
            //item.partOf = {'@id': parent['@id']};
            let validLicense = this.validateLicense(item?.license);
            if (!validLicense) {
              //Try again with its parent or root.
              validLicense = this.validateLicense(parent?.license || first(this._root)?.license);
            }
            if (!validLicense) {
              //put the default one.
              validLicense = this.defaultLicense;
            }
            if (!validLicense) {
              this.log.error('----------------------------------------------------------------');
              this.log.error(`Skipping indexMembers ${item['@id']}, No License Found`);
              this.log.error('----------------------------------------------------------------');
            } else {
              item.license = validLicense;
              await this.indexMembers({parent: item, crateId, _memberOf});
              //Bubble up types to the parent
              for (let t of this.crate.utils.asArray(item._containsTypes)) {
                if (t !== 'RepositoryObject') {
                  if (!parent._containsTypes.includes(t)) {
                    this.crate.pushValue(parent, '_containsTypes', t);
                  }
                }
              }
              const normalCollectionItem = this.crate.getTree({root: item, depth: 1, allowCycle: false});
              normalCollectionItem._root = this._root;
              normalCollectionItem._memberOf = _memberOf;
              try {
                const {body} = await this.client.index({
                  index: this.index,
                  body: Object.assign({}, normalCollectionItem)
                });
              } catch (e) {
                this.log.error('Index normalCollectionItem');
                await this.writeLogFile(crateId, '_normalCollectionItem.json', normalCollectionItem);
              }
            }
          }
        } else if (item['@type'] && item['@type'].includes('RepositoryObject')) {
          item._crateId = crateId;
          //item.conformsTo = 'RepositoryObject';
          //Skip if it does not conformsTo
          if (this.validateConformsTo(item, this.conformsToObject)) {
            //item.partOf = {'@id': parent['@id']};
            let validLicense = this.validateLicense(item?.license);
            if (!validLicense) {
              //Try again with its parent or root.
              validLicense = this.validateLicense(parent?.license || first(this._root)?.license);
            }
            if (!validLicense) {
              //put the default one.
              validLicense = this.defaultLicense;
            }
            if (!validLicense) {
              this.log.error('----------------------------------------------------------------');
              this.log.error(`Skipping indexMembers ${item['@id']}, No License Found`);
              this.log.error('----------------------------------------------------------------');
            } else {
              item.license = validLicense;
              item.name = item['name'] || item['@id'];
              const normalObjectItem = this.crate.getTree({root: item, depth: 1, allowCycle: false});
              const normalParent = [{
                '@id': parent['@id'],
                '@type': parent['@type'],
                name: [{'@value': first(parent['name'])}]
              }];
              //TODO: this below seems unnecessary. What can we do? We are relying
              if (isEqual(_memberOf, normalParent)) {
                normalObjectItem._memberOf = _memberOf;
              } else {
                normalObjectItem._memberOf = _memberOf.concat(normalParent);
              }
              normalObjectItem._root = this._root;
              try {
                const {body} = await this.client.index({
                  index: this.index,
                  body: normalObjectItem
                });
              } catch (e) {
                this.log.error('IndexMembers normalObjectItem');
                this.log.error(e);
                await this.writeLogFile(crateId, '_normalObjectItem.json', normalObjectItem);
              }
              // Add a parent for the @type: File
              for (let typeProxy of this.crate.utils.asArray(item['@type'])) {
                const type = Object.assign({}, typeProxy)
                if (type !== 'RepositoryObject') {
                  if (Array.isArray(parent._containsTypes)) {
                    if (!parent._containsTypes.includes(type)) {
                      this.crate.pushValue(parent, '_containsTypes', type);
                    }
                  }
                }
              }
              //if (item['hasPart']) log.debug(`Getting files for ${crateId}`);
              for (let hasPart of this.crate.utils.asArray(item['hasPart'])) {
                await this.indexFiles({
                  crateId: crateId, item, hasPart, parent, _memberOf
                });
              }
            }
          }
        } else {
          this.log.warn(`Skipping ${item['@id']} not a RepositoryCollection or RepositoryObject or does not have @type`);
        }
      }
    } catch (e) {
      this.log.error(`indexMembers: ${JSON.stringify(e)}`);
    }
  }

  /*
  * Indexing the Objects of the crate and getRootConformsTos of type Object and that are members of the crateId
  * For each RepositoryCollection recurse and get the members
  * Will create elastic of each member of the conformsTo
  * @param {parent, crateId, _memberOf} - The parent crate, crateId it should be memberOf and the _memberOf inherited from indexCollections
  * */
  async indexObjects({parent, crateId, _memberOf}) {
    this.log.debug('indexing objects');
    try {
      //This is the same as doing
      // http://localhost:9000/api/object?conformsTo=https://github.com/Language-Research-Technology/ro-crate-profile%23Object&memberOf=<<crateId>>
      let members = await getRootConformsTos({
        conforms: this.conformsToObject,
        members: crateId
      });
      if (members?.length && members?.length > 0) {
        this.log.info(`Trying to index: ${members.length}`);
      } else {
        this.log.info(`No root conforms in subCollections from ${this.conformsToObject} of member ${crateId}`);
      }
      this.log.debug(`Members of ${crateId} : ${members['length'] || 0}`);
      for (let member of members) {
        //The same as doing:
        // /api/object/meta?id=<<crateId>>
        this.log.debug(`indexObject: member ${member['crateId']}`);
        //TODO: add version
        const rawCrate = await getRawCrate({repository: this.repository, crateId: member['crateId']});
        this.crate = new ROCrate(rawCrate, {alwaysAsArray: true, resolveLinks: true});
        const item = this.crate.rootDataset;
        if (item) {
          if (item['@type'] && item['@type'].includes('RepositoryObject')) {
            //log.debug(`Indexing RepositoryObject of ${item['@id']}`);
            //item._root = root;
            item._crateId = crateId;
            //Skip if it does not conformsTo
            if (this.validateConformsTo(item, this.conformsToObject)) {
              let validLicense = this.validateLicense(item?.license || member?.license || parent?.license || first(this._root)?.license);
              if (!validLicense) {
                //put the default one.
                validLicense = this.defaultLicense;
              }
              if (!validLicense) {
                this.log.error('----------------------------------------------------------------');
                this.log.error(`Skipping indexObjects ${item._crateId}, No License Found`);
                this.log.error('----------------------------------------------------------------');
              } else {
                item.license = validLicense;
                const normalItem = this.crate.getTree({root: item, depth: 1, allowCycle: false});
                normalItem._memberOf = _memberOf;
                //normalItem._root = {"@value": root['@id']};
                normalItem._root = this._root;
                try {
                  let {body} = await this.client.index({
                    index: this.index,
                    body: normalItem
                  });
                } catch (e) {
                  this.log.error('IndexObjects normalItem');
                  await this.writeLogFile(member.crateId, '_normalItem.json', normalItem);
                }
                //Then get a file, same as:
                // /stream?id=<<crateId>>&path=<<pathOfFile>>
                for (let hasPart of this.crate.utils.asArray(item['hasPart'])) {
                  await this.indexFiles({
                    crateId: item['@id'], item, hasPart, parent: item,
                    _memberOf
                  });
                }
              }
            }
          } else {
            this.log.warn(`Skipping ${item['@id']} not a RepositoryObject`);
          }
        }
      }
    } catch (e) {
      this.log.error(`indexObjects: ${JSON.stringify(e)}`);
    }
  }

  /*
  * Indexing the files of the crate
  * For each file get the metadata of particular interest such as language, if its indexable, find encodingFormat
  * Will create elastic of each file and load a file content and index it in _text
  * @param {parent, crateId, item, hasPart _memberOf} - The parent crate, crateId it should be memberOf and the _memberOf inherited
  * the hasPart to get the Id of the file,
  * the item to find metadata of it
  * */
  async indexFiles({parent, crateId, item, hasPart, _memberOf}) {
    try {
      const fileId = hasPart['@id'];
      const fileItem = this.crate.getItem(fileId);
      this.log.debug(`index File: ${fileItem['@id']}`);
      let fileContent = '';
      if (fileItem) {
        //Id already in fileItem
        //crate.pushValue(fileItem, 'file', {'@id': fileItem['@id']});
        fileItem._crateId = crateId;
        let validLicense = this.validateLicense(fileItem.license);
        if (!validLicense) {
          //Try again with its parent or root.
          validLicense = this.validateLicense(item.license || parent?.license);
        }
        if (!validLicense) {
          //put the default one.
          validLicense = this.defaultLicense;
        }
        if (!validLicense) {
          this.log.error('----------------------------------------------------------------');
          this.log.error(`Skipping indexFiles ${fileItem._crateId}, No License Found`);
          this.log.error('----------------------------------------------------------------');
        } else {
          fileItem.license = validLicense;
          fileItem._parent = {
            name: item.name,
            '@id': item['@id'],
            '@type': item['@type']
          }
          if (fileItem.language) {
            for (let fileItemLanguage of toArray(fileItem.language)) {
              const languageItem = this.crate.getItem(fileItemLanguage['@id']);
              if (languageItem) {
                this.crate.pushValue(item, 'language', languageItem);
                if (parent) {
                  this.crate.pushValue(parent, 'language', languageItem);
                }
                this.crate.pushValue(fileItem, 'language', languageItem);
              }
            }
          }
          //TODO find csvs too all text formats
          //Do a reverse if there is an indexableText add the content.
          let normalFileItem;
          try {
            normalFileItem = this.crate.getTree({root: fileItem, depth: 1, allowCycle: false});
            normalFileItem._root = this._root;
            normalFileItem._memberOf = _memberOf;
            //normalFileItem._memberOf = root;
            //TODO: Maybe search for stream pipes in elastic
            const reverse = fileItem['@reverse'];
            if (reverse && reverse['indexableText'] && fileItem.license?.allowTextIndex) {
              if (fileItem['encodingFormat']) {
                const encodingArray = this.crate.utils.asArray(fileItem['encodingFormat']);
                const fileItemFormat = encodingArray.find((ef) => {
                  if (typeof ef === 'string') return ef.match('text/');
                });
                if (fileItemFormat) {
                  const fileObj = await getFile({
                    itemId: crateId,
                    repository: this.repository,
                    filePath: fileItem['@id']
                  });
                  if (fileObj) {
                    if (await fs.stat(path.resolve(fileObj.filePath))) {
                      fileContent = await fs.readFile(path.resolve(fileObj.filePath), 'utf-8');
                      //addContent(item['hasFile'], fileItem['@id'], fileContent);
                      normalFileItem['_text'] = fileContent;
                    } else {
                      normalFileItem['_error'] = 'file_not_found';
                      this.log.error(`path: ${fileObj.filePath} does not resolve to a file`);
                    }
                  }
                }
              }
            }
            normalFileItem._root = this._root;
            const {body} = await this.client.index({
              index: this.index,
              body: normalFileItem
            });
          } catch (e) {
            this.log.error(e);
            this.log.debug('Index normalFileItem')
            await this.writeLogFile(crateId, '_normalFileItem.json', normalFileItem);
          }
        }
      } else {
        this.log.warn(`No files for ${hasPart['@id']}`);
      }
    } catch (e) {
      this.log.error(`indexFiles: ${JSON.stringify(e)}`);
    }
  }

  /*
  * Find the license of an item with its id if not and id or undefined return a default license from
  * config, if passed an Id and not found it will also return a default license.
  * @param {itemOrId} - The parent crate, crateId it should be memberOf and the _memberOf inherited
  * @returns a license object
  * */
  validateLicense(itemOrId) {
    itemOrId = first(itemOrId);
    let license;
    if (typeof itemOrId === "string") {
      try {
        itemOrId = this.crate.getItem(itemOrId);
      } catch (e) {
        this.log.error('Licenses should be @ids of items in rocrate');
        itemOrId = null;
      }
    } else {
      //try to resolve
      try {
        itemOrId = this.crate.getItem(itemOrId?.['@id']);
      } catch (e) {
        this.log.error(`Licenses not resolved with @id: ${itemOrId?.['@id']}`);
        itemOrId = null;
      }
    }
    return itemOrId;
  }

  /*
  * Validate if it conforms to object/collection with configuration item
  * @param {item} - object item
  * @param {conformsTo} - string to compare it with
  * @returns true if item conformsTo, otherwise display error message
  * */
  validateConformsTo(item, conformsTo) {
    let itemConformsTo = false;
    if (item['conformsTo']) {
      for (let c of item['conformsTo']) {
        //for consistency all conformsTo have to be an object with an @id
        if (c['@id'] === conformsTo) {
          itemConformsTo = true;
        }
      }
    }
    if (itemConformsTo) {
      return true;
    } else {
      this.log.info(`item: ${JSON.stringify(item?.['conformsTo'])} does not conformsTo: ${conformsTo}`);
    }
  }
}
