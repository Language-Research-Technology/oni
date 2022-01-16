import { getRootConformsTos } from '../controllers/rootConformsTo';
import { getRawCrate, getRecord } from '../controllers/record';
import { ROCrate } from 'ro-crate';

export async function indexCollections({ configuration, client }) {

  const rootConformsTos = await getRootConformsTos({
    conforms: 'https://github.com/Language-Research-Technology/ro-crate-profile#Collection'
  });
  for (let rootConformsTo of rootConformsTos) {
    const col = rootConformsTo.dataValues;
    let record = await getRecord({ crateId: col.crateId });
    const rawCrate = await getRawCrate({
      diskPath: record.data['diskPath'],
      catalogFilename: configuration.api.ocfl.catalogFilename
    });
    const crate = new ROCrate(rawCrate);
    crate.index();
    const newAuthor = [];
    const item = crate.getRootDataset();
    if (item.author) {
      for (let auth of crate.utils.asArray(item.author)) {
        const author = crate.getItem(auth['@id']);
        if (author) {
          newAuthor.push(author);
        } else {
          newAuthor.push(auth);
        }
      }
      item.author = newAuthor;
    }
    const newIdentifier = [];
    for (let id of crate.utils.asArray(item.identifier)) {
      if (!id['@id']) {
        newIdentifier.push({ name: id })
      } else {
        newIdentifier.push(id)
      }
    }
    item.identifier = newIdentifier;
    item.conformsTo = 'Collection';
    const index = 'items';
    const { body } = await client.index({
      index: index,
      body: item
    });
  }
}
