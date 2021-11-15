const { getRecord, getRawCrate, getUridCrate } = require('../../lib/record');
const { getLogger } = require('../../common');

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

module.exports = {
  getDataRoCrate: getDataRoCrate
}
