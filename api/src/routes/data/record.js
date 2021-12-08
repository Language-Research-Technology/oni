const { getRecord, getRecords } = require('../../controllers/record');
const { getRootConformsTos } = require('../../controllers/rootConformsTo');
const { getRootMemberOfs } = require('../../controllers/rootMemberOf');
const { getRootTypes } = require('../../controllers/rootType');

async function getRecordSingle({ req, res }) {
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

async function getRecordConformsTo({ req, res }) {
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

async function getRecordMembers({ req, res }) {
  let memberOfs = await getRootMemberOfs({ crateId: req.query.id });
  if (memberOfs) {
    res.json(memberOfs).status(200);
  } else {
    res.send({ id: req.query.id, message: 'Not Found' }).status(404);
  }
}

async function getRecordTypes({ req, res }) {
  let recordTypes = await getRootTypes({ crateId: req.query.id });
  if (recordTypes) {
    res.json(recordTypes).status(200);
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

module.exports = {
  getAllRecords,
  getRecordSingle,
  getRecordConformsTo,
  getRecordMembers,
  getRecordTypes
}
