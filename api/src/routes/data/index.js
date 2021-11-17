const { getRootConformsTos } = require('../../controllers/rootConformsTo');
const { getRecord, getRawCrate, getUridCrate, getRecords, getFile } = require('../../controllers/record');
const { getLogger } = require('../../services');
const { getRootMemberOfs } = require('../../controllers/rootMemberOf');
const { getRootTypes } = require('../../controllers/rootType');
const log = getLogger();

async function getDataRoCrate({ req, res, next, configuration }) {
  log.debug(`get data ${ req.query.id }`);
  let record = await getRecord({ crateId: req.query.id });
  if (record.data) {
    let crate;
    switch (req.query.get || null) {
      case 'raw':
        crate = await getRawCrate({
          diskPath: record.data['diskPath'],
          catalogFilename: configuration.api.ocfl.catalogFilename
        });
        res.json(crate);
        break;
      default:
        crate = await getUridCrate({
          host: configuration.api.host,
          crateId: req.query.id,
          diskPath: record.data['diskPath'],
          catalogFilename: configuration.api.ocfl.catalogFilename,
          typesTransform: configuration.api.rocrate.dataTransform.types
        });
        res.json(crate);
    }
  } else {
    res.send({ id: req.query.id, message: 'Not Found' }).status(404);
  }
}

async function getAllRecords({ req, res }) {
  let records = await getRecords({
    offset: req.query.offset,
    limit: req.query.limit,
  });
  res.send({
    total: records.total,
    data: records.data.map((r) => {
      delete r['path'];
      delete r['diskPath'];
      return r;
    })
  });
}

async function getDataSingleRecord({ req, res }) {
  log.debug(`Get data ${ req.query.id }`);
  let record = await getRecord({ crateId: req.query.id });
  if (record.data) {
    delete record.data['path'];
    delete record.data['diskPath'];
    res.send(record.data);
  } else {
    res.send({ id: req.query.id, message: 'Not Found' }).status(404);
  }
}

async function getDataConformsTo({ req, res }) {
  const result = await getRootConformsTos({
    conforms: req.query.conformsTo,
    members: req.query.memberOf
  });
  if (result) {
    res.send({
      total: result.length || 0,
      data: result
    }).status(200);
  } else {
    res.send({
      conformsTo: req.query.conformsTo,
      memberOf: req.query.memberOf,
      message: 'Not Found'
    }).status(404);
  }
}

async function getDataMembers({ req, res }) {
  let memberOfs = await getRootMemberOfs({ crateId: req.query.id });
  if (memberOfs) {
    res.json(memberOfs).status(200);
  } else {
    res.send({ id: req.query.id, message: 'Not Found' }).status(404);
  }
}

async function getDataTypes({ req, res }) {
  let recordTypes = await getRootTypes({ crateId: req.query.id });
  if (recordTypes) {
    res.json(recordTypes).status(200);
  } else {
    res.send({ id: req.query.id, message: 'Not Found' }).status(404);
  }
}


module.exports = {
  getDataRoCrate: getDataRoCrate,
  getAllRecords: getAllRecords,
  getDataSingleRecord: getDataSingleRecord,
  getDataConformsTo: getDataConformsTo,
  getDataMembers: getDataMembers,
  getDataTypes: getDataTypes,
  getDataRoCrate: require('./crate').getDataRoCrate,
  getDataItem: require('./item').getDataItem,
  getResolveLinks: require('./resolve').getResolveLinks,
}
