import {getRecord, getRawCrate, getUridCrate} from '../../controllers/record';
import {getLogger} from '../../services';
import {isUndefined, isEmpty} from 'lodash';
import {getCrate} from "../../controllers/recordResolve";

const log = getLogger();

export async function getRecordCrate({req, res, next, configuration, repository}) {
  log.debug(`get data ${req.query.id}`);
  let getUrid = true;
  if (!isUndefined(req.query.noUrid)) {
    getUrid = false;
  }
  let record = await getRecord({crateId: req.query.id});
  if (!isEmpty(record)) {
    let crate;
    let version = undefined;
    if (!isUndefined(req.query.version)) {
      version = req.query.version;
      if (!version) {
        res.json({message: 'Please specify a version'}).status(400);
      } else {
        res.json({message: 'Version: Not implemented'}).status(400);
      }
    } else if (!isUndefined(req.query.raw)) {
      crate = await getRawCrate({repository, crateId: req.query.id});
      res.json(crate);
    } else if (!isUndefined(req.query.zip)) {
      res.json({message: 'Zip: Not implemented'}).status(400);
    } else {
      if (getUrid) {
        crate = await getUridCrate({
          host: configuration.api.host,
          crateId: req.query.id,
          typesTransform: configuration.api.rocrate.dataTransform.types,
          version,
          repository
        });
        res.json(crate);
      } else {
        crate = await getRawCrate({repository, crateId: req.query.id});
        console.log(JSON.stringify(crate));
        res.json(crate);
      }
    }
  } else {
    res.send({id: req.query.id, message: 'Not Found'}).status(404);
  }
}

