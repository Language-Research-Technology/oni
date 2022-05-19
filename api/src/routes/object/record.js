import {getRecord, getRecords} from '../../controllers/record';
import {getAllRootConformsTos, getRootConformsTos} from '../../controllers/rootConformsTo';
import {getRootMemberOfs} from '../../controllers/rootMemberOf';
import {getRootTypes} from '../../controllers/rootType';
import {getLogger} from '../../services';
import {recordResolve} from '../../controllers/recordResolve';
import {first, isUndefined} from 'lodash';

const log = getLogger();

export async function getRecordSingle({req, res, next}) {
  log.debug(`Get data ${req.query.id}`);
  let record = await getRecord({crateId: req.query.id});
  if (record.data) {
    res.send(record.data);
  } else {
    res.send({id: req.query.id, message: 'Not Found'}).status(404);
  }
  next();
}

export async function getAllRecordConformsTo({req, res, next}) {
  const result = await getAllRootConformsTos({
    offset: req.query.offset,
    limit: req.query.limit
  });
  if (result) {
    res.send({
      total: result.length || 0,
      data: result
    }).status(200);
  } else {
    res.send({
      message: 'Not data found'
    }).status(404);
  }
  next();
}

export async function getRecordConformsTo({req, res, next}) {
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
  next();
}

export async function getRecordMemberOfTop({req, res, next}) {
  let record = await getRecord({crateId: req.query.id});
  let memberOfTopLevel = '';
  if (record.data) {
    log.debug(JSON.stringify(record.data));
    const data = record.data;
    memberOfTopLevel = data.memberOfTopLevel;
  }
  if (memberOfTopLevel) {
    res.send({
      memberOfTopLevel
    });
  } else {
    res.status(404);
    res.send({
      crateId: req.query.id,
      message: 'Not Found'
    });
  }
  next();
}

export async function getRecordMembers({req, res, next}) {
  let memberOfs = await getRootMemberOfs({crateId: req.query.memberOf});
  if (memberOfs) {
    res.json(memberOfs).status(200);
  } else {
    res.send({id: req.query.id, message: 'Not Found'}).status(404);
  }
  next();
}

export async function getRecordTypes({req, res, next}) {
  let recordTypes = await getRootTypes({crateId: req.query.id});
  if (recordTypes) {
    res.json(recordTypes).status(200);
  } else {
    res.send({id: req.query.id, message: 'Not Found'}).status(404);
  }
  next();
}

export async function getAllRecords({req, res, next}) {
  let records = await getRecords({
    offset: req.query.offset,
    limit: req.query.limit,
  });
  res.send({
    total: records.total,
    data: records.data.map((r) => {
      return r;
    })
  });
  next();
}

export async function getResolveParts({req, res, next, configuration, select, repository}) {
  let getUrid = true;
  if(!isUndefined(req.query.noUrid)) {
    getUrid = false;
  }
  const data = await recordResolve({id: req.query.id, getUrid, configuration, repository});
  if (select && select.includes('parts')) {
    let parts = [];
    for (let graph of data['@graph']) {
      if (graph['hasPart'] && graph['hasPart'].length > 0) {
        parts = parts.concat(graph['hasPart']);
      }
    }
    res.json({parts});
  } else {
    res.json({data});
  }
}

